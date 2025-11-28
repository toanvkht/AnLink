const bcrypt = require('bcrypt');
const { query } = require('./src/config/database');

async function resetPasswords() {
  console.log('🔐 Resetting AnLink user passwords...\n');

  try {
    const saltRounds = 12;

    // Generate hashes
    const adminHash = await bcrypt.hash('Admin123!', saltRounds);
    const modHash = await bcrypt.hash('Mod123!', saltRounds);
    const userHash = await bcrypt.hash('User123!', saltRounds);

    // Update admin
    await query(
      "UPDATE users SET password_hash = $1 WHERE email = 'admin@anlink.vn'",
      [adminHash]
    );
    console.log('✅ Admin password reset: admin@anlink.vn / Admin123!');

    // Update moderators
    await query(
      "UPDATE users SET password_hash = $1 WHERE email = 'moderator@anlink.vn'",
      [modHash]
    );
    console.log('✅ Moderator 1 password reset: moderator@anlink.vn / Mod123!');

    await query(
      "UPDATE users SET password_hash = $1 WHERE email = 'mod2@anlink.vn'",
      [modHash]
    );
    console.log('✅ Moderator 2 password reset: mod2@anlink.vn / Mod123!');

    // Update all community users
    const communityUsers = [
      'user1@gmail.com',
      'user2@yahoo.com', 
      'user3@outlook.com',
      'user4@gmail.com',
      'user5@yahoo.com'
    ];

    for (const email of communityUsers) {
      await query(
        "UPDATE users SET password_hash = $1 WHERE email = $2",
        [userHash, email]
      );
      console.log(`✅ User password reset: ${email} / User123!`);
    }

    console.log('\n🎉 All passwords reset successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@anlink.vn');
    console.log('  Password: Admin123!');
    console.log('\nModerator:');
    console.log('  Email: moderator@anlink.vn');
    console.log('  Password: Mod123!');
    console.log('\nCommunity User:');
    console.log('  Email: user1@gmail.com');
    console.log('  Password: User123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  }
}

resetPasswords();