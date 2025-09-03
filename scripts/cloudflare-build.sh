#!/bin/bash
# Cloudflare Pages build script

echo "Setting up environment for Cloudflare Pages..."

# Set environment variable for Cloudflare Pages
export CLOUDFLARE_PAGES=1

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate necessary files
echo "Generating manifest and version..."
npm run generate:manifest
npm run generate:version

# Build the application for export
echo "Building application for static export..."
npm run build

echo "Build completed successfully!"
