import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Divider,
  IconButton,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionService } from '../../services/payment/SubscriptionService';
import { SubscriptionPlan, BillingCycle } from '../../types/payment';

const { width } = Dimensions.get('window');

interface PlanSelectorProps {
  currentPlanId?: string;
  onPlanSelect: (plan: SubscriptionPlan) => void;
  showComparison?: boolean;
  selectedBillingCycle?: BillingCycle;
  onBillingCycleChange?: (cycle: BillingCycle) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  currentPlanId,
  onPlanSelect,
  showComparison = false,
  selectedBillingCycle = BillingCycle.MONTHLY,
  onBillingCycleChange,
}) => {
  const { theme } = useTheme();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, [selectedBillingCycle]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const allPlans = await subscriptionService.getSubscriptionPlans();
      const filteredPlans = allPlans.filter(plan => plan.billing_cycle === selectedBillingCycle);
      setPlans(filteredPlans);
    } catch (error) {
      console.error('Failed to load plans:', error);
      Alert.alert('error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    onPlanSelect(plan);
  };

  const formatPrice = (price: number, currency: string = 'INR') => {
    if (currency === 'INR') {
      return `₹${price.toLocaleString('en-IN')}`;
    }
    return `${currency} ${price}`;
  };

  const getBillingCycleLabel = (cycle: BillingCycle | string) => {
    switch (cycle) {
      case BillingCycle.MONTHLY:
      case 'monthly':
        return '/month';
      case BillingCycle.QUARTERLY:
      case 'quarterly':
        return '/quarter';
      case BillingCycle.YEARLY:
      case 'yearly':
        return '/year';
      default:
        return '/month';
    }
  };

  const calculateSavings = (plan: SubscriptionPlan) => {
    const cycle = plan.billing_cycle;
    if (cycle === BillingCycle.MONTHLY || cycle === 'monthly') return null;

    // Calculate monthly equivalent based on billing cycle
    let monthlyEquivalent: number;
    if (cycle === BillingCycle.QUARTERLY || cycle === 'quarterly') {
      monthlyEquivalent = plan.price / 3;
    } else {
      monthlyEquivalent = plan.price / 12;
    }
    
    // Assume monthly price is 20% higher for calculation
    const assumedMonthlyPrice = monthlyEquivalent * 1.2;
    const savings = ((assumedMonthlyPrice - monthlyEquivalent) / assumedMonthlyPrice) * 100;
    
    return Math.round(savings);
  };

  const renderBillingCycleSelector = () => {
    if (!onBillingCycleChange) return null;

    return (
      <View style={styles.billingCycleContainer}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Billing Cycle
        </Text>
        <View style={styles.cycleButtons}>
          {Object.values(BillingCycle).map((cycle) => (
            <Chip
              key={cycle}
              selected={selectedBillingCycle === cycle}
              onPress={() => onBillingCycleChange(cycle)}
              style={[
                styles.cycleChip,
                selectedBillingCycle === cycle && { backgroundColor: theme.primary }
              ]}
              textStyle={[
                selectedBillingCycle === cycle && { color: theme.OnPrimary }
              ]}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  const renderPlanFeatures = (features: string[]) => {
    return (
      <View style={styles.featuresContainer}>
        {features.slice(0, 5).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon
              name="check-circle"
              size={16}
              color={theme.primary}
            />
            <Text style={[styles.featureText, { color: theme.OnSurfaceVariant }]}>
              {feature}
            </Text>
          </View>
        ))}
        {features.length > 5 && (
          <Text style={[styles.moreFeatures, { color: theme.primary }]}>
            +{features.length - 5} more features
          </Text>
        )}
      </View>
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const isCurrent = currentPlanId === plan.id;
    const savings = calculateSavings(plan);

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => handlePlanSelect(plan)}
        activeOpacity={0.7}
      >
        <Card
          style={[
            styles.planCard,
            isSelected && { borderColor: theme.primary, borderWidth: 2 },
            isCurrent && { backgroundColor: theme.primaryContainer },
            plan.is_popular && styles.popularPlan,
          ]}
        >
          {plan.is_popular && (
            <View style={[styles.popularBadge, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.popularText, { color: theme.OnSecondary }]}>
                Most Popular
              </Text>
            </View>
          )}

          {isCurrent && (
            <View style={[styles.currentBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.currentText, { color: theme.OnPrimary }]}>
                Current Plan
              </Text>
            </View>
          )}

          <Card.Content>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.OnSurface }]}>
                {plan.name}
              </Text>
              {savings && (
                <Chip
                  style={[styles.savingsChip, { backgroundColor: theme.errorContainer }]}
                  textStyle={{ color: theme.OnErrorContainer }}
                  compact
                >
                  Save {savings}%
                </Chip>
              )}
            </View>

            <Text style={[styles.planDescription, { color: theme.OnSurfaceVariant }]}>
              {plan.description}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: theme.primary }]}>
                {formatPrice(plan.price, plan.currency)}
              </Text>
              <Text style={[styles.billingCycle, { color: theme.OnSurfaceVariant }]}>
                {getBillingCycleLabel(plan.billing_cycle)}
              </Text>
            </View>

            <Divider style={styles.divider} />

            {renderPlanFeatures(plan.features)}

            <View style={styles.limitsContainer}>
              <Text style={[styles.limitsTitle, { color: theme.OnSurface }]}>
                Plan Limits:
              </Text>
              <View style={styles.limitsGrid}>
                <View style={styles.limitItem}>
                  <Icon name="people" size={16} color={theme.OnSurfaceVariant} />
                  <Text style={[styles.limitText, { color: theme.OnSurfaceVariant }]}>
                    {plan.limits.max_students} students
                  </Text>
                </View>
                <View style={styles.limitItem}>
                  <Icon name="class" size={16} color={theme.OnSurfaceVariant} />
                  <Text style={[styles.limitText, { color: theme.OnSurfaceVariant }]}>
                    {plan.limits.max_classes_per_month} classes/month
                  </Text>
                </View>
                <View style={styles.limitItem}>
                  <Icon name="storage" size={16} color={theme.OnSurfaceVariant} />
                  <Text style={[styles.limitText, { color: theme.OnSurfaceVariant }]}>
                    {plan.limits.max_storage_gb} GB storage
                  </Text>
                </View>
                <View style={styles.limitItem}>
                  <Icon name="schedule" size={16} color={theme.OnSurfaceVariant} />
                  <Text style={[styles.limitText, { color: theme.OnSurfaceVariant }]}>
                    {plan.limits.max_class_duration_minutes} min/class
                  </Text>
                </View>
              </View>
            </View>

            <Button
              mode={isSelected ? "contained" : "outlined"}
              onPress={() => handlePlanSelect(plan)}
              style={styles.selectButton}
              disabled={isCurrent}
            >
              {isCurrent ? 'Current Plan' : isSelected ? 'Selected' : 'Select Plan'}
            </Button>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.OnSurface }]}>
          Loading subscription plans...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderBillingCycleSelector()}

      <View style={styles.plansContainer}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Choose Your Plan
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.OnSurfaceVariant }]}>
          Select the plan that best fits your coaching needs
        </Text>

        {plans.map(renderPlanCard)}
      </View>

      {showComparison && selectedPlan && (
        <Surface style={[styles.comparisonContainer, { backgroundColor: theme.SurfaceVariant }]}>
          <Text style={[styles.comparisonTitle, { color: theme.OnSurfaceVariant }]}>
            Plan Summary
          </Text>
          <Text style={[styles.comparisonPlan, { color: theme.primary }]}>
            {selectedPlan.name} - {formatPrice(selectedPlan.price)} {getBillingCycleLabel(selectedPlan.billing_cycle)}
          </Text>
          <Text style={[styles.comparisonFeatures, { color: theme.OnSurfaceVariant }]}>
            {selectedPlan.features.length} features included
          </Text>
        </Surface>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  billingCycleContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  cycleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cycleChip: {
    marginRight: 8,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    right: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    zIndex: 1,
    alignSelf: 'center',
    maxWidth: 120,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  currentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  savingsChip: {
    marginLeft: 8,
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  billingCycle: {
    fontSize: 16,
    marginLeft: 4,
  },
  divider: {
    marginVertical: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  limitsContainer: {
    marginBottom: 20,
  },
  limitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  limitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  selectButton: {
    marginTop: 8,
  },
  comparisonContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  comparisonPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comparisonFeatures: {
    fontSize: 14,
  },
});

export default PlanSelector;