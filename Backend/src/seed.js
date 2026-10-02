require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const DoctorProfile = require('./models/DoctorProfile');
const PatientProfile = require('./models/PatientProfile');
const MedicineSearch = require('./models/MedicineSearch');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
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
      name: 'Dr. Sarah Smith',
      email: 'dr.sarah@careconnect.health',
      password: hashedPassword,
      phone: '+1 (555) 234-5678',
      role: 'DOCTOR',
      isVerified: true,
    });

    await DoctorProfile.create({
      userId: docUser1._id,
      specialization: 'Cardiology',
      licenseNumber: 'MD-NY-84920',
      consultationFee: 75,
      experienceYears: 12,
      hospitalAffiliation: 'Metro Heart Institute, New York',
      about: 'Board-certified Cardiologist specializing in preventive cardiology, hypertension management, echocardiography, and cardiovascular risk reduction.',
      education: 'MD from Johns Hopkins University School of Medicine, Cardiology Fellowship at Mount Sinai Hospital',
      averageRating: 4.9,
      totalReviews: 142,
      isAvailable: true,
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    });

    const docUser2 = await User.create({
      name: 'Dr. Marcus Vance',
      email: 'dr.marcus@careconnect.health',
      password: hashedPassword,
      phone: '+1 (555) 345-6789',
      role: 'DOCTOR',
      isVerified: true,
    });

    await DoctorProfile.create({
      userId: docUser2._id,
      specialization: 'General Medicine',
      licenseNumber: 'MD-MA-31945',
      consultationFee: 50,
      experienceYears: 9,
      hospitalAffiliation: 'City Health Clinic, Boston',
      about: 'Dedicated primary care physician focused on family wellness, chronic lifestyle condition control, and preventive diagnostics.',
      education: 'DO from Boston University School of Medicine',
      averageRating: 4.8,
      totalReviews: 98,
      isAvailable: true,
      profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    });

    // 2. Create Patients
    const patientUser1 = await User.create({
      name: 'John Doe',
      email: 'patient.john@example.com',
      password: hashedPassword,
      phone: '+1 (555) 392-1049',
      role: 'PATIENT',
      isVerified: true,
    });

    await PatientProfile.create({
      userId: patientUser1._id,
      bloodGroup: 'O+',
      dateOfBirth: new Date('1992-06-15'),
      gender: 'Male',
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1 (555) 883-9102',
      },
      allergies: ['Penicillin', 'Pollen'],
      chronicConditions: ['Mild Essential Hypertension'],
    });

    // 3. Create Sample Medicines
    const medicinesData = [
      {
        brandName: 'Amoxil',
        genericName: 'Amoxicillin Trihydrate',
        category: 'Antibiotics',
        manufacturer: 'GlaxoSmithKline',
        barcode: '8901086001234',
        dosageForm: 'Oral Capsule 500mg',
        prescriptionRequired: true,
        indications: ['Bacterial respiratory tract infections', 'Otitis media', 'Skin infections'],
        dosage: 'Adults: 250mg to 500mg every 8 hours or 500mg to 875mg every 12 hours.',
        sideEffects: ['Nausea', 'Diarrhea', 'Skin rash'],
        contraindications: ['Hypersensitivity to beta-lactam antibiotics'],
      },
      {
        brandName: 'Lipitor',
        genericName: 'Atorvastatin Calcium',
        category: 'Cardiovascular / Statins',
        manufacturer: 'Pfizer Inc.',
        barcode: '8901086005678',
        dosageForm: 'Oral Tablet 20mg',
        prescriptionRequired: true,
        indications: ['Hypercholesterolemia', 'Cardiovascular risk reduction'],
        dosage: '10mg to 20mg once daily in evening.',
        sideEffects: ['Muscle ache', 'Joint pain', 'Mild GI upset'],
        contraindications: ['Active liver disease', 'Pregnancy'],
      },
      {
        brandName: 'Glucophage',
        genericName: 'Metformin Hydrochloride',
        category: 'Antidiabetic Agents',
        manufacturer: 'Merck Healthcare',
        barcode: '8901086009876',
        dosageForm: 'Extended Release Tablet 500mg',
        prescriptionRequired: true,
        indications: ['Type 2 Diabetes Mellitus glycemic control'],
        dosage: '500mg once daily with evening meal.',
        sideEffects: ['GI discomfort', 'Diarrhea', 'Metallic taste'],
        contraindications: ['Severe renal impairment (eGFR < 30)'],
      },
      {
        brandName: 'Tylenol',
        genericName: 'Acetaminophen / Paracetamol',
        category: 'Analgesics & Antipyretics',
        manufacturer: 'Johnson & Johnson',
        barcode: '8901086003412',
        dosageForm: 'Oral Tablet 500mg',
        prescriptionRequired: false,
        indications: ['Mild to moderate pain', 'Fever reduction'],
        dosage: '500mg to 1000mg every 4 to 6 hours as needed.',
        sideEffects: ['Rare in therapeutic doses'],
        contraindications: ['Severe hepatic impairment'],
      }
    ];

    await MedicineSearch.insertMany(medicinesData);

    console.log('✅ Seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Doctor Account : dr.sarah@careconnect.health / Password123!');
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
