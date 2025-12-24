import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, ownerId, ownerClientId } = body;

    // Validate inputs
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    // Initialize Admin Auth and Firestore
    // This will initialize adminApp if not already initialized
    const db = getAdminDb();
    
    // Get adminApp after initialization
    const { getApps } = await import('firebase-admin/app');
    const apps = getApps();
    if (apps.length === 0) {
      throw new Error('Firebase Admin not initialized');
    }
    const adminAppInstance = apps[0];
    const auth = getAuth(adminAppInstance);

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email.trim().toLowerCase());
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    } catch (error: any) {
      // User doesn't exist, which is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      displayName: name.trim(),
      emailVerified: false,
    });

    // Map team role to UserRole type
    // Team roles: Manager, Operator, Admin, COO, CEO
    // UserRole: 'client' | 'coo' | 'admin'
    let userRole: 'client' | 'coo' | 'admin' = 'client';
    const roleLower = role.toLowerCase();
    if (roleLower === 'coo' || roleLower === 'ceo') {
      userRole = 'coo';
    } else if (roleLower === 'admin' || roleLower === 'manager') {
      userRole = 'admin';
    }

    // Create user document in Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    
    const userData: any = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: userRole,
      // Link to owner's company/clientId if available
      ...(ownerClientId && { clientId: ownerClientId }),
      // Store team role separately for display
      teamRole: role,
      // Store owner ID to track who created this team member
      ownerId: ownerId,
      isOnboarding: false,
      paymentStatus: 'pending',
      billing: {
        status: 'inactive' as const,
        plan: null,
        paymentDate: null,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userDocRef.set(userData);

    // Get owner's data to inherit billing status and company info
    const ownerDocRef = db.collection('users').doc(ownerId);
    const ownerDoc = await ownerDocRef.get();
    
    if (ownerDoc.exists) {
      const ownerData = ownerDoc.data();
      
      // Inherit owner's billing status - team members are part of owner's plan
      const ownerBillingStatus = ownerData?.billing?.status || ownerData?.paymentStatus || 'inactive';
      const ownerBillingPlan = ownerData?.billing?.plan || null;
      
      // Update team member with owner's billing status
      await userDocRef.update({
        billing: {
          status: ownerBillingStatus === 'active' || ownerBillingStatus === 'paid' ? 'active' as const : 'inactive' as const,
          plan: ownerBillingPlan,
          paymentDate: ownerData?.billing?.paymentDate || null,
        },
        paymentStatus: ownerBillingStatus === 'active' || ownerBillingStatus === 'paid' ? 'paid' : 'pending',
        // Mark as team member so they skip onboarding
        isTeamMember: true,
      });

      const existingOnboardingInfo = ownerData?.onboardingInfo || {};
      const existingTeamInfo = existingOnboardingInfo?.teamInfo || {};
      const existingMembers = existingTeamInfo?.members || [];

      // Check if member already exists in the list
      const memberExists = existingMembers.some(
        (m: any) => m.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (!memberExists) {
        const newMember = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role,
        };

        await ownerDocRef.update({
          'onboardingInfo.teamInfo.members': [...existingMembers, newMember],
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: 'Team member created successfully',
    });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak. Please use a stronger password.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create team member' },
      { status: 500 }
    );
  }
}

