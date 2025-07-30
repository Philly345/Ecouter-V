import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';

export default function Pricing() {
  const { user, logout } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for trying out our service',
      features: [
        { text: '2 hours of transcription per month', included: true },
        { text: 'Basic AI transcription', included: true },
        { text: 'Standard accuracy', included: true },
        { text: 'Email support', included: true },
        { text: 'Speaker identification', included: false },
        { text: 'AI chat capabilities', included: false },
        { text: 'Priority processing', included: false },
        { text: 'API access', included: false }
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      price: { monthly: 29, annual: 24 },
      description: 'For professionals and small teams',
      features: [
        { text: '20 hours of transcription per month', included: true },
        { text: 'Advanced AI transcription', included: true },
        { text: '99%+ accuracy', included: true },
        { text: 'Speaker identification (up to 10)', included: true },
        { text: 'AI chat capabilities', included: true },
        { text: 'Priority support', included: true },
        { text: 'Export in multiple formats', included: true },
        { text: 'API access', included: false }
      ],
      cta: 'Start Pro Trial',
      popular: true
    },
    {
      name: 'Business',
      price: { monthly: 99, annual: 79 },
      description: 'For growing businesses and teams',
      features: [
        { text: '100 hours of transcription per month', included: true },
        { text: 'Advanced AI transcription', included: true },
        { text: '99%+ accuracy', included: true },
        { text: 'Speaker identification (up to 10)', included: true },
        { text: 'AI chat capabilities', included: true },
        { text: 'Priority processing', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'API access (10,000 calls/month)', included: true }
      ],
      cta: 'Start Business Trial',
      popular: false
    },
    {
      name: 'Enterprise',
      price: { monthly: 'Custom', annual: 'Custom' },
      description: 'For large organizations with custom needs',
      features: [
        { text: 'Unlimited transcription', included: true },
        { text: 'Custom AI model training', included: true },
        { text: 'On-premise deployment', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'SLA guarantees', included: true },
        { text: 'Advanced security features', included: true },
        { text: 'Unlimited API access', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.'
    },
    {
      question: 'What happens if I exceed my monthly limit?',
      answer: 'You can purchase additional hours at $2 per hour, or upgrade to a higher plan for better value.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. No questions asked.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.'
    },
    {
      question: 'Can I get a custom plan?',
      answer: 'Absolutely! Contact our sales team to discuss custom pricing for unique requirements.'
    }
  ];

  return (
    <>
      <Head>
        <title>Pricing - Ecouter Transcribe</title>
        <meta name="description" content="Simple, transparent pricing for AI-powered transcription services. Start with our free plan or choose from flexible paid options." />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Choose the perfect plan for your transcription needs. Start free, upgrade anytime.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-16">
              <span className={`mr-3 ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-white' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
                Annual <span className="text-green-400 text-sm">(Save 20%)</span>
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative file-card p-8 ${
                    plan.popular ? 'ring-2 ring-white/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      {typeof plan.price.monthly === 'number' ? (
                        <>
                          <span className="text-4xl font-bold">
                            ${isAnnual ? plan.price.annual : plan.price.monthly}
                          </span>
                          <span className="text-gray-400 ml-2">/month</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold">{plan.price.monthly}</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        {feature.included ? (
                          <FiCheck className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        ) : (
                          <FiX className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-white' : 'text-gray-500'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                    className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'border border-gray-600 text-white hover:border-gray-500'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6 bg-gray-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 gradient-text">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-400 text-lg">
                Got questions? We've got answers.
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="file-card p-6">
                  <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Start Transcribing?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join thousands of satisfied customers. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup"
                className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact"
                className="px-8 py-3 border border-gray-600 text-white rounded-lg font-semibold hover:border-gray-500 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
