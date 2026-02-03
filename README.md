# iCook - AI-Powered Cooking App

A premium React Native cooking application with AI-powered recipe import, interactive cook mode, meal planning, and gamification features.

## Features

### Core Features
- 🤖 **AI Recipe Import** - Extract recipes from URLs or photos using Google Gemini AI
- 👨‍🍳 **Interactive Cook Mode** - Full-screen, gesture-controlled step-by-step cooking interface
- 📱 **Recipe Management** - Create, edit, and organize your recipe collection
- 🎯 **Gamification System** - Earn coins and progress through 8 chef tiers
- 📅 **Meal Planning** - Weekly meal calendar with drag-and-drop
- 🛒 **Smart Grocery Lists** - Auto-generated from recipes with category organization
- 🔒 **Authentication** - Google OAuth integration via Supabase
- 💎 **Premium Subscriptions** - RevenueCat integration for Pro features
- 📸 **Photo Capture** - Document your cooking journey with rewards

### Chef Tier System
Progress from **Kitchen Novice** → **Michelin Master** by cooking recipes and earning coins.

## Tech Stack

- **Framework**: React Native with Expo SDK 51
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Google OAuth
- **AI**: Google Gemini API
- **Image Storage**: Cloudinary
- **Payments**: RevenueCat
- **UI/Animations**: Reanimated, Gesture Handler
- **Icons**: Lucide React Native

## Installation

```bash
# Install dependencies
bun install
# or
npm install

# Start development server
bun start
# or
npm start
```

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_key
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your_ios_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your_android_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your_web_client_id
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
3. Enable Google OAuth in Authentication → Providers
4. Copy your project URL and anon key to `.env`

### 3. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Create an upload preset (Settings → Upload)
3. Add cloud name and preset to `.env`

### 4. Google Gemini API

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`

### 5. RevenueCat Setup

1. Create account at [revenuecat.com](https://www.revenuecat.com)
2. Configure iOS/Android apps
3. Add API keys to `.env`

### 6. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials for iOS/Android/Web
3. Add client IDs to `.env`
4. Add redirect URIs in Supabase Dashboard

## Running the App

### Development

```bash
# Start Expo server
bun start

# Run on specific platform
bun run android  # Android
bun run ios      # iOS
bun run web      # Web
```

### Building

```bash
# Development build
eas build --profile development --platform android
eas build --profile development --platform ios

# Production build
eas build --profile production --platform all
```

## Project Structure

```
icook/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication flow
│   ├── (tabs)/              # Main tab navigation
│   ├── recipe/[id].tsx      # Recipe detail
│   ├── cook-mode/[id].tsx   # Interactive cooking
│   ├── ai-import.tsx        # AI recipe import
│   └── settings.tsx         # App settings
├── src/
│   ├── components/          # Reusable UI components
│   ├── config/              # App configuration
│   ├── constants/           # Theme & app constants
│   ├── services/            # External service integrations
│   ├── store/               # Zustand state stores
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Helper functions
└── supabase/
    └── schema.sql           # Database schema
```

## Database Schema

The app uses 12 PostgreSQL tables with Row Level Security (RLS):

- `users` - User profiles with chef tier and coins
- `recipes` - Recipe data with metadata
- `ingredients` - Recipe ingredients
- `instructions` - Step-by-step cooking instructions
- `nutrition_info` - Nutritional information
- `cooked_logs` - Cooking history with photos
- `grocery_lists` - Shopping lists
- `grocery_items` - Individual grocery items
- `user_pantry` - User's ingredient inventory
- `collections` - Recipe collections
- `collection_recipes` - Collection membership
- `meal_plans` - Weekly meal planning

## Key Features Implementation

### AI Recipe Import
Uses Google Gemini 1.5 Flash to extract structured recipe data from:
- URLs (web scraping + AI parsing)
- Photos (OCR + AI extraction)

### Cook Mode
- Full-screen immersive interface
- Swipe gestures for navigation
- Large 36pt fonts for readability
- Screen stays awake during cooking
- Photo capture with coin rewards

### Gamification
- 8 chef tiers with progressive requirements
- Coin rewards for cooking (5-50 coins based on difficulty)
- Photo bonus (+10 coins)
- Milestone celebrations

### Meal Planning
- Weekly calendar view
- Drag-and-drop recipe assignment
- Generate grocery lists from meal plans

## Design System

### Colors
- **Background**: Deep Charcoal (#1A1A1A)
- **Primary**: Egg-Yolk Yellow (#FFCC00)
- **Success**: Sage Green (#B2AC88)
- **Text**: White (#FFFFFF)

### Typography
- **Headings**: SF Pro Rounded
- **Body**: SF Pro Text
- **Cook Mode**: 36pt for optimal readability

## Security

- Row Level Security (RLS) on all tables
- User-scoped data access
- Secure authentication with Supabase
- Environment variables for sensitive keys

## License

MIT

## Support

For issues or questions, contact the development team.
