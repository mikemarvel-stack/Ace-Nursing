/**
 * Seed script — run with: node scripts/seed.js
 * Populates the DB with sample products and an admin user.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PRODUCTS = [
  { title: 'NCLEX-RN Master Study Guide', category: 'Study Guides', price: 29.99, originalPrice: 49.99, pages: 450, badge: 'Best Seller', featured: true, emoji: '📘', rating: { average: 4.9, count: 234 }, totalSales: 1200, description: 'The ultimate NCLEX-RN prep covering all 8 client needs categories with 1,200+ practice questions, rationales, and expert test-taking strategies developed by experienced nurse educators.', tags: ['nclex', 'rn', 'exam prep', 'study guide'] },
  { title: 'Medical Terminology Flashcards', category: 'Flashcards', price: 19.99, originalPrice: 29.99, pages: 120, badge: 'Popular', featured: true, emoji: '🗂️', rating: { average: 4.8, count: 189 }, totalSales: 870, description: '500+ medical terminology flashcards organized by body system. Master medical language quickly with mnemonics, etymology, and clinical examples.', tags: ['flashcards', 'terminology', 'vocabulary'] },
  { title: 'Pharmacology Quick Reference', category: 'Reference Cards', price: 24.99, originalPrice: 39.99, pages: 200, badge: 'New', featured: true, emoji: '💊', rating: { average: 4.9, count: 156 }, totalSales: 640, description: '300+ medications with mechanism of action, dosages, nursing considerations, side effects, and patient teaching points organized by drug class.', tags: ['pharmacology', 'drugs', 'medications', 'reference'] },
  { title: 'Clinical Skills Checklist', category: 'Checklists', price: 14.99, originalPrice: 24.99, pages: 80, badge: null, featured: false, emoji: '✅', rating: { average: 4.7, count: 98 }, totalSales: 320, description: '50+ core nursing procedure competency checklists for nursing students and preceptors including IV insertion, catheterization, and wound care.', tags: ['clinical', 'skills', 'checklist', 'procedures'] },
  { title: 'Anatomy & Physiology Atlas', category: 'Study Guides', price: 34.99, originalPrice: 54.99, pages: 380, badge: 'Top Rated', featured: true, emoji: '🫀', rating: { average: 4.8, count: 201 }, totalSales: 950, description: '300+ labeled illustrations covering all body systems with physiological processes, clinical correlations, and pathophysiology highlights.', tags: ['anatomy', 'physiology', 'atlas', 'illustrations'] },
  { title: 'Critical Care Nursing Handbook', category: 'Reference Cards', price: 27.99, originalPrice: 44.99, pages: 290, badge: 'Advanced', featured: false, emoji: '🏥', rating: { average: 4.9, count: 143 }, totalSales: 480, description: 'Advanced ICU reference covering hemodynamic monitoring, ventilator management, CRRT, vasoactive medications, and emergency protocols.', tags: ['critical care', 'icu', 'advanced', 'handbook'] },
  { title: 'NCLEX-PN Complete Bundle', category: 'Bundles', price: 44.99, originalPrice: 74.99, pages: 620, badge: 'Best Value', featured: true, emoji: '📦', rating: { average: 4.8, count: 178 }, totalSales: 720, description: 'Everything you need to pass the NCLEX-PN: study guide, practice questions, drug cards, lab values, and clinical decision-making scenarios.', tags: ['nclex', 'pn', 'bundle', 'complete'] },
  { title: 'Nursing Math & Dosage Calculations', category: 'Study Guides', price: 16.99, originalPrice: 26.99, pages: 150, badge: null, featured: false, emoji: '🔢', rating: { average: 4.7, count: 267 }, totalSales: 1100, description: 'Step-by-step dosage calculation guide with 400+ practice problems, conversion formulas, and real-world clinical scenarios.', tags: ['math', 'dosage', 'calculations', 'nursing'] },
  { title: 'Psychiatric Nursing Notes', category: 'Study Guides', price: 22.99, originalPrice: 36.99, pages: 180, badge: null, featured: false, emoji: '🧠', rating: { average: 4.6, count: 89 }, totalSales: 310, description: 'Concise psych nursing review covering DSM-5 disorders, therapeutic communication, psychotropic medications, and crisis intervention.', tags: ['psychiatric', 'mental health', 'psych', 'dsm-5'] },
  { title: 'Lab Values Quick Reference', category: 'Reference Cards', price: 12.99, originalPrice: 19.99, pages: 60, badge: 'Must Have', featured: false, emoji: '🧪', rating: { average: 4.8, count: 312 }, totalSales: 1450, description: 'Normal ranges, critical values, and nursing implications for 100+ common laboratory tests in pocket-size format.', tags: ['lab values', 'reference', 'quick guide', 'labs'] },
  { title: 'OB & Maternity Nursing Pack', category: 'Bundles', price: 32.99, originalPrice: 52.99, pages: 320, badge: null, featured: false, emoji: '👶', rating: { average: 4.7, count: 124 }, totalSales: 420, description: 'Complete OB/maternity resource covering antepartum, intrapartum, postpartum care with pediatric nursing essentials and newborn assessment.', tags: ['ob', 'maternity', 'obstetrics', 'pediatric'] },
  { title: 'NCLEX High-Yield Flash Cards', category: 'Flashcards', price: 21.99, originalPrice: 34.99, pages: 200, badge: 'Fan Fave', featured: true, emoji: '⚡', rating: { average: 4.9, count: 445 }, totalSales: 1800, description: '800 high-yield NCLEX flashcards covering priority nursing concepts, med-surg, pharmacology, and delegation/prioritization frameworks.', tags: ['nclex', 'flashcards', 'high-yield', 'priority'] },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    const Product = require('../models/Product');
    const User = require('../models/User');

    await Product.deleteMany({});
    console.log('🗑️  Cleared products');

    // Create products
    const created = [];
    for (const productData of PRODUCTS) {
      const product = await Product.create(productData);
      created.push(product);
    }
    console.log(`✅ Seeded ${created.length} products`);

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@acenursing.com' });
    if (!adminExists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'AceNursing',
        email: 'admin@acenursing.com',
        password: 'Admin@acenursing2025',
        role: 'admin',
      });
      console.log('✅ Admin user created: admin@acenursing.com / Admin@acenursing2025');
      console.log('⚠️  Change admin password immediately after first login!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🚀 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
