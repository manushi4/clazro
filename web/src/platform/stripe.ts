// Use @stripe/react-stripe-js for web
export const StripeProvider = ({ children }: any) => children;
export const useStripe = () => ({
  presentPaymentSheet: async () => ({ error: { message: 'Use web Stripe SDK' } }),
});

export default {
  StripeProvider,
  useStripe,
};
