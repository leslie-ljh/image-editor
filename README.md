# ImageCraft - Online Image Editor

A powerful, browser-based image editor built with Next.js and Canvas API. All processing happens in your browser - no server required.

![ImageCraft Screenshot](https://via.placeholder.com/800x450?text=ImageCraft+Editor)

## ✨ Features

### 🎨 Basic Adjustments
- **Brightness** - Adjust image brightness (-100 to +100)
- **Contrast** - Modify image contrast (-100 to +100)
- **Saturation** - Control color saturation (-100 to +100)
- **Temperature** - Warm or cool color temperature (-100 to +100)

### 🖼️ Filter Effects
- Black & White (Grayscale)
- Vintage (Sepia)
- LOMO (High contrast + vignette)
- Warm
- Cool
- Retro
- Dramatic
- Faded

### ⚡ Enhancement Tools
- **Blur** - Apply blur effect (0-20px)
- **Sharpen** - Sharpen image details (0-100)
- **Noise** - Add film grain effect (0-100)
- **Clarity** - Enhance local contrast (0-100)

### 🔄 Transform Tools
- **Rotate** - Rotate 90° left or right
- **Flip** - Horizontal and vertical flip
- **Crop** - Interactive crop tool with aspect ratio guide

### 📤 Export Options
- Multiple formats: JPEG, PNG, WebP
- Adjustable quality for JPEG and WebP
- Direct download to your device

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/leslie-ljh/image-editor.git

# Navigate to project directory
cd image-editor

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/leslie-ljh/image-editor)

1. Fork or clone this repository
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"
6. Done! Your image editor is live 🎉

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Image Processing**: Canvas API (client-side)
- **Icons**: React Icons (Feather)
- **File Upload**: React Dropzone

## 📁 Project Structure

```
image-editor/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Main page
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   └── ImageEditor.tsx # Main editor component
│   └── utils/
│       └── imageProcessing.ts  # Image processing algorithms
├── public/
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 How It Works

All image processing is performed client-side using the Canvas API:

1. **Load** - Image is loaded into a canvas element
2. **Process** - Pixel manipulation via ImageData API
3. **Display** - Real-time preview as adjustments are made
4. **Export** - Canvas is converted to blob and downloaded

## 🌐 Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## 📝 License

MIT

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [React Dropzone](https://react-dropzone.js.org/)
