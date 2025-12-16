'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Building2, Users, Link2, CheckSquare } from 'lucide-react';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';

type TeamMember = {
  name: string;
  email: string;
  role: string;
};

type TeamSetup = {
  members: TeamMember[];
};

const DEFAULT_TEAM: TeamSetup = {
  members: [
    { name: '', email: '', role: '' },
  ],
};


export default function TeamSetupPage() {
  const router = useRouter();
  const { user, userData, loading, refreshUserData } = useAuth();

  const [team, setTeam] = useState<TeamSetup>(DEFAULT_TEAM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<number, Partial<Record<keyof TeamMember, string>>>>({});
  const [saveError, setSaveError] = useState<string>('');

  // Prefill from userData if available
  const initialTeam = useMemo(() => {
    const data: any = userData as any;
    return {
      members: data?.onboardingInfo?.teamInfo?.members || [{ name: '', email: '', role: '' }],
    };
  }, [userData]);

  useEffect(() => {
    setTeam(initialTeam);
  }, [initialTeam]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    setTeam((prev) => {
      const newMembers = [...prev.members];
      newMembers[index] = { ...newMembers[index], [field]: value };
      return { ...prev, members: newMembers };
    });
    // Clear error when user starts typing
    if (errors[index]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [index]: { ...prev[index], [field]: undefined },
      }));
    }
    setSaveError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<number, Partial<Record<keyof TeamMember, string>>> = {};

    team.members.forEach((member, index) => {
      const memberErrors: Partial<Record<keyof TeamMember, string>> = {};

      if (!member.email.trim()) {
        memberErrors.email = 'Email is required';
      } else if (!validateEmail(member.email.trim())) {
        memberErrors.email = 'Please enter a valid email address';
      }

      if (!member.name.trim()) {
        memberErrors.name = 'Name is required';
      }

      if (!member.role) {
        memberErrors.role = 'Role is required';
      }

      // Check for duplicate emails
      const duplicateIndex = team.members.findIndex(
        (m, i) => i !== index && m.email.trim().toLowerCase() === member.email.trim().toLowerCase() && m.email.trim() !== ''
      );
      if (duplicateIndex !== -1) {
        memberErrors.email = 'This email is already added';
      }

      // Check if email matches current user's email
      if (member.email.trim().toLowerCase() === userData?.email?.toLowerCase()) {
        memberErrors.email = 'You cannot add your own email as a team member';
      }

      if (Object.keys(memberErrors).length > 0) {
        newErrors[index] = memberErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addMember = () => {
    setTeam((prev) => ({
      ...prev,
      members: [...prev.members, { name: '', email: '', role: '' }],
    }));
  };

  const removeMember = (index: number) => {
    if (team.members.length > 1) {
      setTeam((prev) => ({
        ...prev,
        members: prev.members.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSave = async (goToNextStep: boolean) => {
    if (!user) return;

    // Filter out completely empty members
    const validMembers = team.members.filter(
      (member) => member.email.trim() || member.name.trim() || member.role
    );

    // If there are members with data, validate them
    if (validMembers.length > 0) {
      // Create a temporary team object for validation
      const tempTeam = { members: validMembers };
      
      // Validate the members
      const memberErrors: Record<number, Partial<Record<keyof TeamMember, string>>> = {};
      let hasErrors = false;

      validMembers.forEach((member, index) => {
        const memberError: Partial<Record<keyof TeamMember, string>> = {};

        if (!member.email.trim()) {
          memberError.email = 'Email is required';
          hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())) {
          memberError.email = 'Please enter a valid email address';
          hasErrors = true;
        }

        if (!member.name.trim()) {
          memberError.name = 'Name is required';
          hasErrors = true;
        }

        if (!member.role) {
          memberError.role = 'Role is required';
          hasErrors = true;
        }

        // Check for duplicate emails
        const duplicateIndex = validMembers.findIndex(
          (m, i) => i !== index && m.email.trim().toLowerCase() === member.email.trim().toLowerCase() && m.email.trim() !== ''
        );
        if (duplicateIndex !== -1) {
          memberError.email = 'This email is already added';
          hasErrors = true;
        }

        // Check if email matches current user's email
        if (member.email.trim().toLowerCase() === userData?.email?.toLowerCase()) {
          memberError.email = 'You cannot add your own email as a team member';
          hasErrors = true;
        }

        if (Object.keys(memberError).length > 0) {
          memberErrors[index] = memberError;
        }
      });

      if (hasErrors) {
        setErrors(memberErrors);
        setSaveError('Please fix the errors before continuing');
        return;
      }
      
      performSave(goToNextStep, validMembers);
    } else {
      // No team members added, that's okay - save empty array
      performSave(goToNextStep, []);
    }
  };

  const performSave = async (goToNextStep: boolean, membersToSave: TeamMember[]) => {
    if (!user) return;
    
    setSaving(true);
    setSaveError('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc: any = userData as any;
      
      // Get existing onboardingInfo or create new structure
      const existingOnboardingInfo = userDoc?.onboardingInfo || {};
      
      // Clean and validate members before saving
      const cleanedMembers = membersToSave
        .filter((member) => member.email.trim() && member.name.trim() && member.role)
        .map((member) => ({
          email: member.email.trim().toLowerCase(),
          name: member.name.trim(),
          role: member.role,
        }));

      await updateDoc(userRef, {
        onboardingInfo: {
          ...existingOnboardingInfo,
          teamInfo: {
            members: cleanedMembers,
          },
        },
        updatedAt: serverTimestamp(),
      });
      
      await refreshUserData();
      
      if (goToNextStep) {
        router.push('/onboarding/integrations');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Error saving team info:', err);
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#dcecf6] via-[#ddeef8] to-[#f5ede2] flex items-center justify-center py-12">
      <div className="w-full px-[123px]">
        {/* Stepper */}
        <OnboardingStepper activeStep="team" completedSteps={['company']} />

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#020F3F]">Team Setup</h2>
          </div>

          <div className="p-6 space-y-6">
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

            {/* Information Banner */}
            <div className="border-2 border-orange-400 bg-orange-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-700">
                Invite your team members to collaborate. They'll receive an email invitation.
              </p>
            </div>

            {/* Current Team Members */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Current Team Members</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">
                        {userData?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">You</div>
                      <div className="text-xs text-gray-500">{userData?.email || ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Owner</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invite Team Member */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Invite Team Member</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                {team.members.map((member, index) => (
                  <div key={index} className={index > 0 ? 'mt-4 pt-4 border-t border-gray-200' : ''}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Email {index === 0 && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="email"
                          value={member.email || ''}
                          onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                          className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                            errors[index]?.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="email@company.com"
                        />
                        {errors[index]?.email && (
                          <p className="text-xs text-red-600">{errors[index].email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Full Name {index === 0 && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={member.name || ''}
                          onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                          className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                            errors[index]?.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="John Doe"
                        />
                        {errors[index]?.name && (
                          <p className="text-xs text-red-600">{errors[index].name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Role {index === 0 && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                          <select
                            value={member.role || ''}
                            onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                            className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none cursor-pointer pr-10 ${
                              errors[index]?.role ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select role</option>
                            <option value="Owner">Owner</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                            <option value="Operator">Operator</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {errors[index]?.role && (
                          <p className="text-xs text-red-600">{errors[index].role}</p>
                        )}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeMember(index)}
                            className="text-xs text-red-600 hover:text-red-700 mt-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {team.members.length < 10 && (
                  <button
                    type="button"
                    onClick={addMember}
                    className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 text-sm transition-colors"
                  >
                    + ADD TEAM MEMBER
                  </button>
                )}
                {team.members.length >= 10 && (
                  <p className="text-xs text-gray-500 text-center">Maximum 10 team members allowed</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-5 flex items-center justify-between bg-gray-50">
            <button
              type="button"
              onClick={() => router.push('/onboarding/company')}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← BACK
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="flex items-center gap-2 rounded-full bg-[#E79138] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : 'SAVE & CONTINUE'} →
              </button>
              <button
                type="button"
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                onClick={() => router.push('/dashboard')}
              >
                SKIP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

