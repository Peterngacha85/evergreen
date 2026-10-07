const ContributionCampaign = require('../models/ContributionCampaign');
const Contribution = require('../models/Contribution');
const Member = require('../models/Member');
const Setting = require('../models/Setting');

// Member fields needed to work out who owes what on a campaign
const MEMBER_STATUS_FIELDS = 'name idNumber phoneNumber profilePhoto isActive isDeactivated deactivationHistory joinDate createdAt';

// Older campaigns were created before per-campaign minimums existed; they
// fall back to the current global default until a leader sets their own.
const effectiveMinimum = (campaign, defaultMin) =>
  campaign.minContribution != null ? campaign.minContribution : (defaultMin || 0);

const paymentStatus = (paid, minimum) => {
  if (paid <= 0) return 'unpaid';
  if (minimum > 0 && paid < minimum) return 'partial';
  return 'paid';
};

// True if the member was deactivated for non-payment at the given moment
const wasDeactivatedAt = (member, date) => {
  const at = new Date(date);
  return (member.deactivationHistory || []).some((h) =>
    new Date(h.deactivatedAt) <= at && (!h.reactivatedAt || new Date(h.reactivatedAt) > at)
  );
};

// What a deactivated member is told when they are refused access: why they
// were deactivated and what they owe.
const deactivationNotice = (member) => ({
  code: 'ACCOUNT_DEACTIVATED',
  message: 'Your account has been deactivated. Please contact a leader to have it reactivated.',
  deactivation: {
    name: member.name,
    reasons: (member.deactivationHistory || [])
      .filter((h) => !h.reactivatedAt)
      .map((h) => ({ reason: h.reason || '', amountOwed: h.amountOwed || 0, deactivatedAt: h.deactivatedAt })),
  },
});

// Who is expected to pay: active members who had joined by the time the
// campaign started and were not deactivated then, excluding the member the
// campaign is supporting.
const isEligible = (member, campaign) => {
  if (!member.isActive) return false;
  if (campaign.targetMember && String(campaign.targetMember._id || campaign.targetMember) === String(member._id)) return false;
  const joined = new Date(member.joinDate || member.createdAt);
  if (joined > new Date(campaign.createdAt)) return false;
  return !wasDeactivatedAt(member, campaign.createdAt);
};

// Builds one row per member who either owes or has paid toward the campaign.
// `contribs` are this campaign's contributions (at most one per member).
const buildCampaignRows = (campaign, members, contribs, minimum) => {
  const contribByMember = new Map(contribs.map((c) => [String(c.member), c]));
  const rows = [];

  for (const member of members) {
    const contrib = contribByMember.get(String(member._id));
    const eligible = isEligible(member, campaign);
    if (!eligible && !contrib) continue;

    const paid = contrib?.amount || 0;
    rows.push({
      member: {
        _id: member._id, name: member.name, idNumber: member.idNumber,
        phoneNumber: member.phoneNumber, profilePhoto: member.profilePhoto,
        isDeactivated: !!member.isDeactivated,
      },
      eligible,
      status: paymentStatus(paid, minimum),
      paid,
      outstanding: eligible ? Math.max(0, minimum - paid) : 0,
      contributionId: contrib?._id || null,
      datePaid: contrib?.datePaid || null,
      description: contrib?.description || '',
    });
  }

  rows.sort((a, b) => a.member.idNumber.localeCompare(b.member.idNumber));
  return rows;
};

const summarizeRows = (rows, minimum) => {
  const eligibleRows = rows.filter((r) => r.eligible);
  return {
    eligibleCount: eligibleRows.length,
    paidCount: rows.filter((r) => r.status === 'paid').length,
    partialCount: rows.filter((r) => r.status === 'partial').length,
    unpaidCount: rows.filter((r) => r.status === 'unpaid').length,
    totalCollected: rows.reduce((sum, r) => sum + r.paid, 0),
    expectedTotal: eligibleRows.length * minimum,
    outstandingTotal: rows.reduce((sum, r) => sum + r.outstanding, 0),
  };
};

// Deactivates every expected member who had not paid the full minimum when
// the campaign's deadline passed. Members already deactivated are left as is.
const deactivateUnpaidForCampaign = async (campaign) => {
  const [contribs, members, defaultMin] = await Promise.all([
    Contribution.find({ campaign: campaign._id }).select('member amount').lean(),
    Member.find({ isActive: true }).select(MEMBER_STATUS_FIELDS).lean(),
    Setting.getValue('minContribution'),
  ]);

  const minimum = effectiveMinimum(campaign, defaultMin);
  const membersById = new Map(members.map((m) => [String(m._id), m]));
  const owing = buildCampaignRows(campaign, members, contribs, minimum)
    .filter((r) => r.eligible && r.status !== 'paid' && !membersById.get(String(r.member._id)).isDeactivated);

  if (owing.length > 0) {
    const now = new Date();
    await Member.bulkWrite(owing.map((r) => ({
      updateOne: {
        filter: { _id: r.member._id, isDeactivated: { $ne: true } },
        update: {
          $set: { isDeactivated: true },
          $push: {
            deactivationHistory: {
              deactivatedAt: now,
              campaign: campaign._id,
              amountOwed: r.outstanding,
              reason: r.status === 'partial'
                ? `Paid only part of the minimum for "${campaign.title}" by the deadline`
                : `Did not contribute to "${campaign.title}" by the deadline`,
            },
          },
        },
      },
    })));
  }

  return owing.length;
};

// Processes every campaign whose deadline has passed and hasn't been handled
// yet. Each campaign is claimed atomically, so concurrent calls never process
// the same campaign twice. Throttled, because it runs from busy endpoints as
// well as a background timer (the timer alone isn't reliable on hosts that
// sleep when idle).
let lastRun = 0;
let running = null;

const runDeadlineCheck = ({ force = false } = {}) => {
  if (running) return running;
  if (!force && Date.now() - lastRun < 60 * 1000) return Promise.resolve();
  lastRun = Date.now();

  running = (async () => {
    for (;;) {
      const campaign = await ContributionCampaign.findOneAndUpdate(
        { deadline: { $lte: new Date() }, deadlineProcessedAt: null },
        { $set: { deadlineProcessedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (!campaign) break;

      try {
        const count = await deactivateUnpaidForCampaign(campaign);
        await ContributionCampaign.updateOne({ _id: campaign._id }, { $set: { deactivatedCount: count } });
      } catch (err) {
        // Release the claim so the next run retries this campaign
        await ContributionCampaign.updateOne({ _id: campaign._id }, { $set: { deadlineProcessedAt: null } });
        throw err;
      }
    }
  })()
    .catch((err) => console.error('Campaign deadline check failed:', err.message))
    .finally(() => { running = null; });

  return running;
};

module.exports = {
  MEMBER_STATUS_FIELDS,
  effectiveMinimum,
  paymentStatus,
  deactivationNotice,
  isEligible,
  buildCampaignRows,
  summarizeRows,
  runDeadlineCheck,
};
