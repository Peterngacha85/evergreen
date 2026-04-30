const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load models
const Member = require('./server/models/Member');
const Leader = require('./server/models/Leader');

dotenv.config({ path: './server/.env' });

const repairPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const leaders = await Leader.find({ isActive: true });
    let fixedCount = 0;

    for (const leader of leaders) {
      // Find the corresponding member record
      const member = await Member.findOne({ idNumber: leader.idNumber }).select('+password');
      
      if (member) {
        // Update the leader password with the member's hashed password
        // Since we fixed the pre-save hook, leader.save() will NOT re-hash this if it's already a hash.
        leader.password = member.password;
        leader.plainPassword = member.plainPassword || leader.plainPassword;
        await leader.save();
        fixedCount++;
        console.log(`Fixed password for Leader: ${leader.name} (${leader.idNumber})`);
      }
    }

    console.log(`\nSuccessfully repaired ${fixedCount} leader accounts.`);
    process.exit(0);
  } catch (err) {
    console.error('Repair failed:', err);
    process.exit(1);
  }
};

repairPasswords();
