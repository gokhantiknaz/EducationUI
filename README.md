# Eğitim Platformu - React Native Mobil Uygulama

Udemy tarzı eğitim platformu için geliştirilmiş React Native mobil uygulaması.

## 🚀 Özellikler

### Tamamlanan Özellikler
- ✅ Kullanıcı Kayıt/Giriş Sistemi
- ✅ JWT Token Tabanlı Kimlik Doğrulama
- ✅ Otomatik Token Yenileme
- ✅ Dashboard (Ana Sayfa)
- ✅ Kurs Listesi ve Görüntüleme
- ✅ State Management (Zustand)
- ✅ API Servisleri

### Geliştirilecek Özellikler
- 🔄 Kurs Detay Ekranı
- 🔄 Video Player
- 🔄 Quiz Sistemi
- 🔄 İlerleme Takibi
- 🔄 Kategori Filtreleme
- 🔄 Ödeme Entegrasyonu
- 🔄 Profil Yönetimi

## 📋 Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- iOS Simulator (macOS) veya Android Emulator

## 🛠️ Kurulum

1. Bağımlılıkları yükleyin:
\`\`\`bash
cd education-app
npm install
\`\`\`

2. Backend API URL'ini yapılandırın:
\`\`\`javascript
// src/constants/config.js dosyasını düzenleyin
export const API_BASE_URL = 'http://YOUR_BACKEND_URL/api';
\`\`\`

3. Uygulamayı başlatın:
\`\`\`bash
npm start
\`\`\`

4. Platform seçin:
- iOS: `i` tuşuna basın
- Android: `a` tuşuna basın
- Web: `w` tuşuna basın

## 📁 Proje Yapısı

\`\`\`
education-app/
├── src/
│   ├── components/       # Reusable UI bileşenleri
│   │   ├── Button.js
│   │   ├── Input.js
│   │   └── Loading.js
│   ├── constants/        # Sabitler ve yapılandırmalar
│   │   ├── theme.js      # Renkler, boyutlar, fontlar
│   │   └── config.js     # API endpoints, storage keys
│   ├── navigation/       # Navigation yapısı
│   │   ├── RootNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── MainNavigator.js
│   ├── screens/          # Ekranlar
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   └── DashboardScreen.js
│   ├── services/         # API servisleri
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── courseService.js
│   │   └── quizService.js
│   └── store/            # State management (Zustand)
│       ├── authStore.js
│       └── courseStore.js
├── App.js
├── package.json
└── babel.config.js
\`\`\`

## 🎨 Tema ve Renkler

Uygulama özelleştirilebilir bir tema sistemi kullanmaktadır:

\`\`\`javascript
COLORS = {
  primary: '#6C5CE7',      // Ana renk
  secondary: '#A29BFE',    // İkincil renk
  accent: '#FD79A8',       // Vurgu rengi
  success: '#00B894',      // Başarı
  error: '#D63031',        // Hata
  warning: '#FDCB6E',      // Uyarı
}
\`\`\`

## 🔐 Kimlik Doğrulama

- JWT token tabanlı kimlik doğrulama
- Otomatik token yenileme
- Güvenli token saklama (AsyncStorage)
- 401 hatalarında otomatik refresh token kullanımı

## 📱 API Entegrasyonu

Tüm API istekleri merkezi bir axios instance üzerinden yapılır:

\`\`\`javascript
// Örnek kullanım
import courseService from '../services/courseService';

const courses = await courseService.getCourses();
const course = await courseService.getCourseDetail(courseId);
\`\`\`

## 🧪 Test

\`\`\`bash
npm test
\`\`\`

## 📦 Build

### Android APK
\`\`\`bash
expo build:android
\`\`\`

### iOS IPA
\`\`\`bash
expo build:ios
\`\`\`

## 🚀 Sıradaki Adımlar

1. **Video Player Entegrasyonu**
   - react-native-video ile video oynatıcı
   - Amazon S3/CloudFront entegrasyonu
   - İlerleme takibi

2. **Kurs Detay Ekranı**
   - Kurs bilgileri
   - Bölüm listesi
   - Ön izleme videoları

3. **Quiz Sistemi**
   - Çoktan seçmeli sorular
   - Puan hesaplama
   - Sonuç ekranı

4. **Ödeme Entegrasyonu**
   - Kredi kartı ödeme
   - Satın alma işlemleri

5. **Profil ve Ayarlar**
   - Kullanıcı bilgileri
   - Şifre değiştirme
   - Bildirim ayarları

## 👥 Katkıda Bulunma

1. Bu projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için: [email protected]

---

**Not:** Backend API'nin çalışır durumda olması gerekmektedir. Backend kurulumu için backend projesinin README dosyasına bakın.
