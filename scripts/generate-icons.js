const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = {
  // iPhone
  'Icon-App-20x20@2x.png': 40,
  'Icon-App-20x20@3x.png': 60,
  'Icon-App-29x29@2x.png': 58,
  'Icon-App-29x29@3x.png': 87,
  'Icon-App-40x40@2x.png': 80,
  'Icon-App-40x40@3x.png': 120,
  'Icon-App-60x60@2x.png': 120,
  'Icon-App-60x60@3x.png': 180,
  
  // iPad
  'Icon-App-20x20@1x.png': 20,
  'Icon-App-29x29@1x.png': 29,
  'Icon-App-40x40@1x.png': 40,
  'Icon-App-76x76@1x.png': 76,
  'Icon-App-76x76@2x.png': 152,
  'Icon-App-83.5x83.5@2x.png': 167,  // iPad Pro
  
  // App Store
  'ItunesArtwork@2x.png': 1024
};

const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 首先填充纯白色背景，确保没有透明度
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // 创建背景
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1E88E5');   // 微调蓝色
  gradient.addColorStop(0.5, '#1976D2');
  gradient.addColorStop(1, '#1565C0');

  // 绘制主背景
  ctx.fillStyle = gradient;
  const radius = size * 0.22;
  roundedRect(ctx, 0, 0, size, size, radius);
  ctx.fill();

  // 添加纸张效果 - 使用不透明的白色
  ctx.fillStyle = '#FFFFFF';  // 改为纯白色，不使用 rgba
  const paperMargin = size * 0.12;
  const paperWidth = size - (paperMargin * 2);
  const paperHeight = size - (paperMargin * 2);
  roundedRect(ctx, paperMargin, paperMargin, paperWidth, paperHeight, radius * 0.8);
  ctx.fill();

  // 添加装饰线条 - 使用不透明的颜色
  ctx.strokeStyle = '#E3F2FD';
  ctx.lineWidth = size * 0.01;
  for (let i = 1; i < 4; i++) {
    const y = paperMargin + (paperHeight * (i/4));
    ctx.beginPath();
    ctx.moveTo(paperMargin + size * 0.05, y);
    ctx.lineTo(size - paperMargin - size * 0.05, y);
    ctx.stroke();
  }

  // 绘制 Markdown 符号
  ctx.fillStyle = '#1976D2';
  ctx.font = `bold ${size * 0.25}px Monaco`;
  ctx.fillText('#', paperMargin + size * 0.08, paperMargin + size * 0.25);

  // 绘制"码"字
  ctx.fillStyle = '#1565C0';  // 使用纯色而不是渐变
  ctx.font = `bold ${size * 0.35}px PingFang SC`;
  ctx.fillText('码', paperMargin + size * 0.35, paperMargin + size * 0.6);

  // 移除阴影效果，因为它可能导致透明度
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  return canvas;
}

// 辅助函数：绘制圆角矩形
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 添加 generateContentsJson 函数
function generateContentsJson() {
  return {
    "images": [
      {
        "size": "20x20",
        "idiom": "iphone",
        "filename": "Icon-App-20x20@2x.png",
        "scale": "2x"
      },
      {
        "size": "20x20",
        "idiom": "iphone",
        "filename": "Icon-App-20x20@3x.png",
        "scale": "3x"
      },
      {
        "size": "29x29",
        "idiom": "iphone",
        "filename": "Icon-App-29x29@2x.png",
        "scale": "2x"
      },
      {
        "size": "29x29",
        "idiom": "iphone",
        "filename": "Icon-App-29x29@3x.png",
        "scale": "3x"
      },
      {
        "size": "40x40",
        "idiom": "iphone",
        "filename": "Icon-App-40x40@2x.png",
        "scale": "2x"
      },
      {
        "size": "40x40",
        "idiom": "iphone",
        "filename": "Icon-App-40x40@3x.png",
        "scale": "3x"
      },
      {
        "size": "60x60",
        "idiom": "iphone",
        "filename": "Icon-App-60x60@2x.png",
        "scale": "2x"
      },
      {
        "size": "60x60",
        "idiom": "iphone",
        "filename": "Icon-App-60x60@3x.png",
        "scale": "3x"
      },
      {
        "size": "20x20",
        "idiom": "ipad",
        "filename": "Icon-App-20x20@1x.png",
        "scale": "1x"
      },
      {
        "size": "20x20",
        "idiom": "ipad",
        "filename": "Icon-App-20x20@2x.png",
        "scale": "2x"
      },
      {
        "size": "29x29",
        "idiom": "ipad",
        "filename": "Icon-App-29x29@1x.png",
        "scale": "1x"
      },
      {
        "size": "29x29",
        "idiom": "ipad",
        "filename": "Icon-App-29x29@2x.png",
        "scale": "2x"
      },
      {
        "size": "40x40",
        "idiom": "ipad",
        "filename": "Icon-App-40x40@1x.png",
        "scale": "1x"
      },
      {
        "size": "40x40",
        "idiom": "ipad",
        "filename": "Icon-App-40x40@2x.png",
        "scale": "2x"
      },
      {
        "size": "76x76",
        "idiom": "ipad",
        "filename": "Icon-App-76x76@1x.png",
        "scale": "1x"
      },
      {
        "size": "76x76",
        "idiom": "ipad",
        "filename": "Icon-App-76x76@2x.png",
        "scale": "2x"
      },
      {
        "size": "83.5x83.5",
        "idiom": "ipad",
        "filename": "Icon-App-83.5x83.5@2x.png",
        "scale": "2x"
      },
      {
        "size": "1024x1024",
        "idiom": "ios-marketing",
        "filename": "ItunesArtwork@2x.png",
        "scale": "1x"
      }
    ],
    "info": {
      "version": 1,
      "author": "xcode"
    }
  };
}

async function generateAndroidIcons() {
  for (const [folder, size] of Object.entries(androidSizes)) {
    const canvas = generateIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const dir = path.join(__dirname, `../android/app/src/main/res/${folder}`);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), buffer);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), buffer);
  }
}

// 修改主函数
async function generateAllIcons() {
  if (process.argv.includes('android')) {
    await generateAndroidIcons();
  } else {
    const iconDir = path.join(__dirname, '../ios/MarkdownApp/Images.xcassets/AppIcon.appiconset');
    
    // 确保目录存在
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }
    
    // 生成每个尺寸的图标
    for (const [filename, size] of Object.entries(sizes)) {
      console.log(`Generating ${filename} (${size}x${size})`);
      const canvas = generateIcon(size);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(path.join(iconDir, filename), buffer);
    }
    
    // 生成 Contents.json
    const contentsJson = generateContentsJson();
    fs.writeFileSync(
      path.join(iconDir, 'Contents.json'),
      JSON.stringify(contentsJson, null, 2)
    );
  }
}

generateAllIcons().catch(console.error); 