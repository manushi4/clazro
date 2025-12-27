// Razorpay web SDK should be loaded via script tag
const RazorpayCheckout = {
  open: (options: any) => {
    console.log('Razorpay web checkout:', options);
    // Implement web Razorpay checkout here
  },
};

export default RazorpayCheckout;
