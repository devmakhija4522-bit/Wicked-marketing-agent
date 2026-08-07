@echo off
echo Pushing latest 3D UI changes to GitHub...
cd /d "c:\Users\makhi\OneDrive\Desktop\WICKED- Marketing agent"
git add .
git commit -m "Deploy 3D Light Blue Glassmorphism UI to Vercel and Render"
git push origin main
echo Done!
