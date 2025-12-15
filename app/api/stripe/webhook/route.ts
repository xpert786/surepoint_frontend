import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received - starting verification...');
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  console.log('📋 Webhook details:', {
    hasSignature: !!signature,
    signatureLength: signature?.length || 0,
    hasWebhookSecret: !!webhookSecret,
    webhookSecretLength: webhookSecret.length,
    bodyLength: body.length,
  });

  if (!signature) {
    console.error('❌ No signature provided in webhook request');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set in environment variables!');
    console.error('Please add STRIPE_WEBHOOK_SECRET to your .env.local file');
    console.error('Get it from Stripe CLI: stripe listen --print-secret');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event;

  try {
    console.log('🔐 Verifying webhook signature...');
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Webhook signature verified successfully');
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed!');
    console.error('Error message:', err.message);
    console.error('Error type:', err.type);
    console.error('This usually means:');
    console.error('1. STRIPE_WEBHOOK_SECRET in .env.local does not match Stripe CLI secret');
    console.error('2. Get the correct secret from: stripe listen --print-secret');
    console.error('3. Or check Stripe Dashboard → Webhooks → Signing secret');
    return NextResponse.json(
      { 
        error: `Webhook signature verification failed: ${err.message}`,
        hint: 'Check that STRIPE_WEBHOOK_SECRET matches your Stripe CLI or Dashboard webhook secret'
      },
      { status: 400 }
    );
  }

  try {
    console.log('🔔 Webhook event received:', event.type);
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId || session.metadata?.firebaseUserId;
        const plan = session.metadata?.plan || 'basic';

        console.log('📋 Session details:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          customer: session.customer,
          metadata: session.metadata,
          userId: userId,
          plan: plan,
        });

        if (!userId) {
          console.error('❌ No userId found in session metadata!');
          console.error('Session metadata:', JSON.stringify(session.metadata, null, 2));
          console.error('Full session object keys:', Object.keys(session));
          break;
        }

        console.log('✅ Processing checkout.session.completed for user:', userId);
        
        // Only update if payment is actually paid
        if (session.payment_status !== 'paid') {
          console.warn('⚠️ Payment status is not "paid":', session.payment_status);
          break;
        }
        
        // Update user billing status via internal API route
        try {
          const internalSecret = process.env.INTERNAL_API_SECRET || 'your-secret-key-change-in-production';
          const updateUrl = `${request.nextUrl.origin}/api/internal/update-user-billing`;
          
          console.log('📤 Calling update API:', updateUrl);
          console.log('📤 With userId:', userId);
          
          const updateResponse = await fetch(updateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${internalSecret}`,
            },
            body: JSON.stringify({
              userId,
              updates: {
                'billing.status': 'active',
                'billing.plan': plan,
                'billing.paymentDate': new Date().toISOString(),
                'billing.stripeCustomerId': session.customer,
                'billing.stripeSessionId': session.id,
                paymentStatus: 'paid',
                subscriptionTier: plan,
                paymentDate: new Date().toISOString(),
                stripeCustomerId: session.customer,
              },
            }),
          });

          console.log('📥 Update response status:', updateResponse.status);

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error('❌ Failed to update user billing:', errorData);
            throw new Error(`Failed to update user: ${errorData.error}`);
          }

          const updateData = await updateResponse.json();
          console.log('✅ User billing updated successfully:', updateData);
        } catch (updateError: any) {
          console.error('❌ Error updating user billing in webhook:', updateError);
          console.error('Error message:', updateError.message);
          console.error('Error stack:', updateError.stack);
          // Don't throw - log error but don't fail webhook
        }
        break;
      }
      
      case 'charge.succeeded':{
        const charge = event.data.object as any;
        console.log('💳 Charge succeeded:', charge.id);
        console.log('💳 Charge customer:', charge.customer);
        console.log('📋 Charge metadata:', charge.metadata);
        
        // Try to get userId from charge metadata
        let userId = charge.metadata?.userId || charge.metadata?.firebaseUserId;
        let plan = charge.metadata?.plan || 'basic';
        
        // If not in metadata, try to find the checkout session that created this charge
        if (!userId) {
          try {
            // Search for checkout sessions with this charge
            const sessions = await stripe.checkout.sessions.list({
              limit: 10,
            });
            
            const matchingSession = sessions.data.find(
              (s: any) => s.charge === charge.id
            );
            
            if (matchingSession) {
              userId = matchingSession.metadata?.userId || matchingSession.metadata?.firebaseUserId;
              plan = matchingSession.metadata?.plan || plan;
              console.log('📋 Found session for charge, userId:', userId);
            }
          } catch (err) {
            console.error('Error finding session for charge:', err);
          }
        }
        
        if (userId) {
          console.log('✅ Processing charge.succeeded for user:', userId);
          
          try {
            const internalSecret = process.env.INTERNAL_API_SECRET || 'your-secret-key-change-in-production';
            const updateUrl = `${request.nextUrl.origin}/api/internal/update-user-billing`;
            
            const updateResponse = await fetch(updateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalSecret}`,
              },
              body: JSON.stringify({
                userId,
                updates: {
                  'billing.status': 'active',
                  'billing.plan': plan,
                  paymentStatus: 'paid',
                  subscriptionTier: plan,
                  stripeCustomerId: charge.customer,
                },
              }),
            });

            if (updateResponse.ok) {  
              const updateData = await updateResponse.json();
              console.log('✅ User billing updated from charge:', updateData);
            } else {
              const errorData = await updateResponse.json();
              console.error('❌ Failed to update from charge:', errorData);
            }
          } catch (error) {
            console.error('❌ Error updating from charge:', error);
          }
        } else {
          console.warn('⚠️ No userId found in charge - skipping update');
          console.warn('Charge ID:', charge.id);
          console.warn('Charge customer:', charge.customer);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        console.log('💳 PaymentIntent succeeded:', paymentIntent.id);
        console.log('💳 PaymentIntent customer:', paymentIntent.customer);
        console.log('📋 PaymentIntent metadata:', paymentIntent.metadata);
        
        // Try to get userId from payment intent metadata
        let userId = paymentIntent.metadata?.userId || paymentIntent.metadata?.firebaseUserId;
        let plan = paymentIntent.metadata?.plan || 'basic';
        
        // If not in metadata, try to find the checkout session that created this payment intent
        if (!userId) {
          try {
            // Search for checkout sessions with this payment intent
            const sessions = await stripe.checkout.sessions.list({
              limit: 10,
            });
            
            const matchingSession = sessions.data.find(
              (s: any) => s.payment_intent === paymentIntent.id
            );
            
            if (matchingSession) {
              userId = matchingSession.metadata?.userId || matchingSession.metadata?.firebaseUserId;
              plan = matchingSession.metadata?.plan || plan;
              console.log('📋 Found session for payment_intent, userId:', userId);
            }
          } catch (err) {
            console.error('Error finding session for payment_intent:', err);
          }
        }
        
        if (userId) {
          console.log('✅ Processing payment_intent.succeeded for user:', userId);
          
          try {
            const internalSecret = process.env.INTERNAL_API_SECRET || 'your-secret-key-change-in-production';
            const updateUrl = `${request.nextUrl.origin}/api/internal/update-user-billing`;
            
            const updateResponse = await fetch(updateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalSecret}`,
              },
              body: JSON.stringify({
                userId,
                updates: {
                  'billing.status': 'active',
                  'billing.plan': plan,
                  paymentStatus: 'paid',
                  subscriptionTier: plan,
                  stripeCustomerId: paymentIntent.customer,
                },
              }),
            });

            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              console.log('✅ User billing updated from payment_intent:', updateData);
            } else {
              const errorData = await updateResponse.json();
              console.error('❌ Failed to update from payment_intent:', errorData);
            }
          } catch (error) {
            console.error('❌ Error updating from payment_intent:', error);
          }
        } else {
          console.warn('⚠️ No userId found in payment_intent - skipping update');
          console.warn('PaymentIntent ID:', paymentIntent.id);
          console.warn('PaymentIntent customer:', paymentIntent.customer);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const userId = paymentIntent.metadata?.userId || paymentIntent.metadata?.firebaseUserId;

        if (userId) {
          try {
            const internalSecret = process.env.INTERNAL_API_SECRET || 'your-secret-key-change-in-production';
            await fetch(`${request.nextUrl.origin}/api/internal/update-user-billing`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalSecret}`,
              },
              body: JSON.stringify({
                userId,
                updates: {
                  'billing.status': 'failed',
                  paymentStatus: 'failed',
                },
              }),
            });
          } catch (error) {
            console.error('Error updating failed payment status:', error);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Find user by Stripe Customer ID and update status
        // Note: In production, you might want to store a mapping of customerId -> userId
        // For now, we'll update via metadata if available
        const userId = subscription.metadata?.firebaseUserId;
        if (userId) {
          try {
            const internalSecret = process.env.INTERNAL_API_SECRET || 'your-secret-key-change-in-production';
            await fetch(`${request.nextUrl.origin}/api/internal/update-user-billing`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalSecret}`,
              },
              body: JSON.stringify({
                userId,
                updates: {
                  'billing.status': 'cancelled',
                  'billing.plan': null,
                  paymentStatus: 'cancelled',
                },
              }),
            });
          } catch (error) {
            console.error('Error updating cancelled subscription:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

