import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import courseService from '../services/courseService';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';

const PurchaseScreen = ({ route, navigation }) => {
  const { course } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoData, setPromoData] = useState(null); // { promoCodeId, discountAmount, discountType, discountValue }
  const [discount, setDiscount] = useState(0);

  const originalPrice = course?.price || 0;
  const discountedPrice = course?.discountPrice || null;
  const currentPrice = discountedPrice || originalPrice;
  const finalPrice = promoApplied ? currentPrice - discount : currentPrice;

  const paymentMethods = [
    { id: 'credit_card', name: 'Kredi Kartı', icon: 'card-outline', description: 'Visa, Mastercard, Troy' },
    { id: 'bank_transfer', name: 'Havale/EFT', icon: 'business-outline', description: 'Banka transferi ile ödeme' },
  ];

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showInfoToast('Lütfen promosyon kodu girin', 'Bilgi');
      return;
    }

    setIsValidatingPromo(true);
    try {
      const result = await courseService.validatePromoCode(
        promoCode.trim(),
        course.id,
        currentPrice
      );

      if (result.isValid) {
        setPromoApplied(true);
        setDiscount(result.discountAmount);
        setPromoData({
          promoCodeId: result.promoCodeId,
          discountAmount: result.discountAmount,
          discountType: result.discountType,
          discountValue: result.discountValue,
        });
        showSuccessToast(
          result.discountType === 'Percentage'
            ? `%${result.discountValue} indirim uygulandı!`
            : `${result.discountAmount.toFixed(2)} ₺ indirim uygulandı!`,
          'Promosyon Kodu'
        );
      } else {
        showErrorToast(result.errorMessage || 'Geçersiz promosyon kodu', 'Hata');
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      showErrorToast(error.message || 'Promosyon kodu doğrulanamadı', 'Hata');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(false);
    setDiscount(0);
    setPromoData(null);
    setPromoCode('');
    showInfoToast('Promosyon kodu kaldırıldı', 'Bilgi');
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      // Sipariş oluştur
      const orderResult = await courseService.createOrder([course.id], selectedPaymentMethod === 'credit_card' ? 'CreditCard' : 'BankTransfer');

      if (orderResult && orderResult.orderId) {
        // Promosyon kodu uygulandıysa, siparişe ekle
        if (promoApplied && promoData?.promoCodeId) {
          try {
            await courseService.applyPromoCode(
              promoData.promoCodeId,
              orderResult.orderId,
              promoData.discountAmount
            );
          } catch (promoError) {
            console.error('Promo apply error:', promoError);
            // Promo uygulama hatası siparişi iptal etmemeli, sadece logla
          }
        }

        // Demo amaçlı: Siparişi hemen tamamla
        // Gerçek uygulamada burada ödeme gateway'e yönlendirme yapılır
        const completeResult = await courseService.completeOrder(orderResult.orderId, {
          transactionId: `DEMO_${Date.now()}`,
          paymentMethod: selectedPaymentMethod,
        });

        showSuccessToast('Satın alma başarılı! Kursa erişiminiz aktif edildi.', 'Tebrikler');

        // Kurs detay sayfasına geri dön
        navigation.goBack();
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showErrorToast(error.message || 'Satın alma işlemi başarısız oldu', 'Hata');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return `${price.toLocaleString('tr-TR')} ₺`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Satın Al</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Summary Card */}
        <View style={styles.courseCard}>
          {course?.thumbnailUrl && (
            <Image source={{ uri: course.thumbnailUrl }} style={styles.courseThumbnail} />
          )}
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={2}>{course?.title}</Text>
            <Text style={styles.courseInstructor}>{course?.instructorName || 'Eğitmen'}</Text>
            <View style={styles.courseMeta}>
              {course?.durationMinutes && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
                  <Text style={styles.metaText}>
                    {Math.floor(course.durationMinutes / 60)}s {course.durationMinutes % 60}dk
                  </Text>
                </View>
              )}
              {course?.sections && (
                <View style={styles.metaItem}>
                  <Ionicons name="list-outline" size={14} color={COLORS.textLight} />
                  <Text style={styles.metaText}>
                    {course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} ders
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Yöntemi</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodCard,
                selectedPaymentMethod === method.id && styles.paymentMethodCardSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <View style={[
                styles.paymentMethodIcon,
                selectedPaymentMethod === method.id && styles.paymentMethodIconSelected,
              ]}>
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={selectedPaymentMethod === method.id ? COLORS.white : COLORS.primary}
                />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={[
                  styles.paymentMethodName,
                  selectedPaymentMethod === method.id && styles.paymentMethodNameSelected,
                ]}>
                  {method.name}
                </Text>
                <Text style={styles.paymentMethodDesc}>{method.description}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedPaymentMethod === method.id && styles.radioOuterSelected,
              ]}>
                {selectedPaymentMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promosyon Kodu</Text>
          {promoApplied ? (
            <View style={styles.promoAppliedContainer}>
              <View style={styles.promoAppliedInfo}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <View style={styles.promoAppliedText}>
                  <Text style={styles.promoAppliedCode}>{promoCode}</Text>
                  <Text style={styles.promoAppliedDiscount}>
                    {promoData?.discountType === 'Percentage'
                      ? `%${promoData?.discountValue} indirim`
                      : `${discount.toFixed(2)} ₺ indirim`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.promoRemoveButton} onPress={handleRemovePromo}>
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Promosyon kodunuz varsa girin"
                placeholderTextColor={COLORS.textLight}
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                editable={!isValidatingPromo}
              />
              <TouchableOpacity
                style={[styles.promoButton, isValidatingPromo && styles.promoButtonDisabled]}
                onPress={handleApplyPromo}
                disabled={isValidatingPromo}
              >
                {isValidatingPromo ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.promoButtonText}>Uygula</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Kurs Ücreti</Text>
              <Text style={[
                styles.summaryValue,
                discountedPrice && styles.summaryValueStrike,
              ]}>
                {formatPrice(originalPrice)}
              </Text>
            </View>

            {discountedPrice && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>İndirimli Fiyat</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  {formatPrice(discountedPrice)}
                </Text>
              </View>
            )}

            {promoApplied && discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Promosyon İndirimi</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatPrice(discount)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalValue}>{formatPrice(finalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Satın alımınıza dahil:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>Ömür boyu erişim</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>Mobil ve web erişimi</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>Tamamlama sertifikası</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>30 gün para iade garantisi</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>Toplam</Text>
          <Text style={styles.bottomPriceValue}>{formatPrice(finalPrice)}</Text>
        </View>
        <Button
          title={isProcessing ? 'İşleniyor...' : 'Satın Al'}
          onPress={handlePurchase}
          variant="primary"
          size="large"
          style={styles.purchaseButton}
          disabled={isProcessing}
        />
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingText}>Ödemeniz işleniyor...</Text>
            <Text style={styles.processingSubtext}>Lütfen bekleyin</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: SIZES.padding,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  courseThumbnail: {
    width: 100,
    height: 100,
  },
  courseInfo: {
    flex: 1,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  section: {
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.paddingLarge,
  },
  sectionTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.paddingSmall,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  paymentMethodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  paymentMethodIconSelected: {
    backgroundColor: COLORS.primary,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  paymentMethodNameSelected: {
    color: COLORS.primary,
  },
  paymentMethodDesc: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  promoContainer: {
    flexDirection: 'row',
    gap: SIZES.paddingSmall,
  },
  promoInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 14,
    fontSize: SIZES.body2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promoButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingLarge,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  promoButtonDisabled: {
    backgroundColor: COLORS.primary + '80',
  },
  promoButtonText: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.white,
  },
  promoAppliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.success + '15',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  promoAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  promoAppliedText: {
    marginLeft: SIZES.paddingSmall,
  },
  promoAppliedCode: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.success,
  },
  promoAppliedDiscount: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  promoRemoveButton: {
    padding: SIZES.paddingSmall,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  summaryLabel: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  summaryValueStrike: {
    textDecorationLine: 'line-through',
    color: COLORS.textLight,
  },
  discountValue: {
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.padding,
  },
  totalLabel: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  featuresSection: {
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.paddingLarge,
  },
  featuresSectionTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
    marginBottom: SIZES.paddingSmall,
  },
  featureText: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    gap: SIZES.padding,
  },
  bottomPriceContainer: {
    alignItems: 'flex-start',
  },
  bottomPriceLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  bottomPriceValue: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  purchaseButton: {
    flex: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge * 2,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  processingText: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.padding,
  },
  processingSubtext: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: SIZES.paddingSmall,
  },
});

export default PurchaseScreen;
