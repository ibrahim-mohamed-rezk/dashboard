const fs = require('fs');
let content = fs.readFileSync('components/partials/sidebar/module/index.tsx', 'utf8');
const replacements = {
  'item.name === "ExamsStatistics"': '(item.name === "ExamsStatistics" || item.path === "ExamsStatistics" || item.path === "statistics")',
  'item.name === "questions_statistics"': '(item.name === "questions_statistics" || item.path === "questions_statistics")',
  'item.name === "questions_statistics_teacher"': '(item.name === "questions_statistics_teacher" || item.path === "questions_statistics_teacher")',
  'item.name === "Courses"': '(item.name === "Courses" || item.path === "courses")',
  'item.name === "Banks"': '(item.name === "Banks" || item.path === "banks")',
  'item.name === "students"': '(item.name === "students" || item.path === "students")',
  'item.name === "codes"': '(item.name === "codes" || item.path === "codes" || item.path === "subscription_codes")',
  'item.name === "Banners"': '(item.name === "Banners" || item.path === "banners")',
  'item.name === "Blogs"': '(item.name === "Blogs" || item.path === "blogs")',
  'item.name === "Books"': '(item.name === "Books" || item.path === "books")',
  'item.name === "settings"': '(item.name === "settings" || item.path === "settings")',
  'item.name === "Teachers"': '(item.name === "Teachers" || item.path === "teachers")',
  'item.name === "Admins"': '(item.name === "Admins" || item.path === "admins")',
  'item.name === "places"': '(item.name === "places" || item.path === "places")',
  'item.name === "Places"': '(item.name === "Places" || item.name === "places" || item.path === "places")',
  'item.name === "levels"': '(item.name === "levels" || item.path === "levels")',
  'item.name === "jobs"': '(item.name === "jobs" || item.path === "jobs")',
  'item.name === "coupons"': '(item.name === "coupons" || item.path === "coupons")',
  'item.name === "subjects"': '(item.name === "subjects" || item.path === "subjects")',
  'item.name === "Exams"': '(item.name === "Exams" || item.path === "exams")'
};
for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}
fs.writeFileSync('components/partials/sidebar/module/index.tsx', content);
console.log('Replacements completed.');
