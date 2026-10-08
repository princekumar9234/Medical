require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const DoctorProfile = require('./models/DoctorProfile');
const PatientProfile = require('./models/PatientProfile');
const MedicineSearch = require('./models/MedicineSearch');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing
    await User.deleteMany({});
    await DoctorProfile.deleteMany({});
    await PatientProfile.deleteMany({});
    await MedicineSearch.deleteMany({});

    console.log('🧹 Cleaned existing records.');

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Create Doctors
    const docUser1 = await User.create({
      fullName: 'Dr. Sarah Smith',
      email: 'dr.sarah@mediq.health',
      password: hashedPassword,
      phone: '9876543210',
      role: 'doctor',
      isVerified: true,
      isEmailVerified: true,
    });

    await DoctorProfile.create({
      user: docUser1._id,
      specialization: 'Cardiology',
      qualifications: 'MD, Cardiology Fellowship',
      yearsOfExperience: 12,
      consultationFee: 800,
      about: 'Board-certified Cardiologist specializing in preventive cardiology, hypertension management, echocardiography, and cardiovascular risk reduction.',
      registrationNumber: 'MD-NY-84920',
      education: [{ degree: 'MD', institution: 'Johns Hopkins University School of Medicine', year: 2008 }]
    });

    const docUser2 = await User.create({
      fullName: 'Dr. Marcus Vance',
      email: 'dr.marcus@mediq.health',
      password: hashedPassword,
      phone: '9876543211',
      role: 'doctor',
      isVerified: true,
      isEmailVerified: true,
    });

    await DoctorProfile.create({
      user: docUser2._id,
      specialization: 'General Medicine',
      qualifications: 'DO',
      yearsOfExperience: 9,
      consultationFee: 500,
      about: 'Dedicated primary care physician focused on family wellness, chronic lifestyle condition control, and preventive diagnostics.',
      registrationNumber: 'MD-MA-31945',
      education: [{ degree: 'DO', institution: 'Boston University School of Medicine', year: 2011 }]
    });

    // 2. Create Patients
    const patientUser1 = await User.create({
      fullName: 'John Doe',
      email: 'patient.john@example.com',
      password: hashedPassword,
      phone: '9876543212',
      role: 'patient',
      isVerified: true,
      isEmailVerified: true,
    });

    await PatientProfile.create({
      user: patientUser1._id,
      bloodGroup: 'O+',
      dateOfBirth: new Date('1992-06-15'),
      gender: 'Male',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '9876543213',
      allergies: ['Penicillin', 'Pollen'],
      chronicConditions: ['Mild Essential Hypertension'],
    });





    console.log('✅ Seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Doctor Account : dr.sarah@mediq.health / Password123!');
    console.log('Patient Account: patient.john@example.com / Password123!');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
