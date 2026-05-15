// Loan Request Page - Public form for loan requests
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Languages, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

type LoanRequestFormData = {
  loan_purpose: string;
  other_purpose?: string;
  requested_amount: string;
  phone: string;
};

const LOAN_PURPOSES = [
  'CAR',
  'HOUSE',
  'SCHOOL',
  'CHILDREN',
  'BUSINESS',
  'MEDICAL',
  'WEDDING',
  'AGRICULTURE',
  'OTHER',
];

export default function LoanRequest() {
  const navigate = useNavigate();
  const { t, i18n: i18nInstance, ready } = useTranslation();
  const { isAuthenticated, member: authMember } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18nInstance.language || 'en');
  
  // Fetch full member profile from database if authenticated
  const { data: profileData } = useQuery({
    queryKey: ['member-profile'],
    queryFn: async () => {
      const response = await api.client.getProfile();
      return response.member;
    },
    enabled: isAuthenticated,
  });
  
  // Use fetched profile data if available, fallback to auth member
  const member = profileData || authMember;
  
  // Check if request was just submitted (from login redirect)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('submitted') === 'true') {
      setSubmitted(true);
      // Clean up URL
      window.history.replaceState({}, '', '/loan-request');
    }
  }, []);
  
  // Update current language when i18n language changes
  useEffect(() => {
    const updateLang = (lng: string) => {
      setCurrentLang(lng || 'en');
    };
    
    i18nInstance.on('languageChanged', updateLang);
    setCurrentLang(i18nInstance.language || 'en');
    
    return () => {
      i18nInstance.off('languageChanged', updateLang);
    };
  }, [i18nInstance]);
  
  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'am' : 'en';
    i18nInstance.changeLanguage(newLang).then(() => {
      setCurrentLang(newLang);
    });
  };
  
  // Wait for translations to be ready
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Create schema with translations
  const loanRequestSchema = z.object({
    loan_purpose: z.string().min(1, t('validation.required', 'This field is required')),
    other_purpose: z.string().optional(),
    requested_amount: z.string().regex(/^\d+(\.\d{1,2})?$/, t('validation.required', 'Please enter a valid amount')),
    phone: z.string().regex(/^\+251\d{9}$/, t('validation.invalid_phone', 'Please enter a valid phone number')),
  }).refine((data) => {
    if (data.loan_purpose === 'OTHER') {
      return !!data.other_purpose && data.other_purpose.trim() !== '';
    }
    return true;
  }, {
    message: t('validation.required', 'Please specify the loan purpose'),
    path: ['other_purpose'],
  });

  const form = useForm<LoanRequestFormData>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      loan_purpose: '',
      other_purpose: '',
      requested_amount: '',
      phone: '+251', // Will be updated when profile loads
    },
  });

  // Update phone when member profile data loads from database
  useEffect(() => {
    if (isAuthenticated && member) {
      // Get phone from database - try phone_primary first, then phone
      const memberPhone = member.phone_primary || member.phone;
      if (memberPhone && memberPhone.trim() !== '' && memberPhone.trim() !== '+251') {
        // Only update if we have a valid phone number from database
        const currentPhone = form.getValues('phone');
        if (!currentPhone || currentPhone === '+251' || currentPhone.trim() === '') {
          form.setValue('phone', memberPhone.trim());
        }
      }
    }
  }, [isAuthenticated, member, form]);

  const loanPurpose = form.watch("loan_purpose");

  const onSubmit = async (data: LoanRequestFormData) => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    try {
      // If not authenticated, save to localStorage and redirect to login
      if (!isAuthenticated) {
        const pendingRequest = {
          loan_purpose: data.loan_purpose,
          other_purpose: data.other_purpose,
          requested_amount: data.requested_amount,
          phone: data.phone,
        };
        localStorage.setItem('pendingLoanRequest', JSON.stringify(pendingRequest));
        toast({
          title: t('loan_request.login_required', 'Login Required'),
          description: t('loan_request.login_required_desc', 'Please login or register as a member to submit your loan request.'),
        });
        setIsSubmitting(false);
        navigate('/auth/login?redirect=/loan-request');
        return;
      }

      // If authenticated, submit directly
      const payload: any = {
        loan_purpose: data.loan_purpose,
        requested_amount: parseFloat(data.requested_amount),
        phone: data.phone, // Include phone even for authenticated users
      };

      if (data.loan_purpose === 'OTHER' && data.other_purpose) {
        payload.other_purpose = data.other_purpose;
      }

      await api.public.createLoanRequest(payload);

      setSubmitted(true);
      setIsSubmitting(false);
      toast({
        title: t('loan_request.submitted_title', 'Loan Request Submitted'),
        description: t('loan_request.submitted_desc', 'Your loan request has been submitted successfully. A staff member will review your application and contact you soon.'),
      });
    } catch (error: any) {
      setIsSubmitting(false);
      let errorMessage = t('loan_request.messages.submit_failed', 'Failed to submit loan request.');
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((detail: any) => {
            const field = detail.path?.join('.') || detail.context?.label || 'field';
            return `${field}: ${detail.message}`;
          }).join(', ');
          errorMessage = t('loan_request.messages.validation_failed', 'Validation failed: {{errors}}', { errors: validationErrors });
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: t('error', 'Error'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('loan_request.submitted_title', 'Loan Request Submitted')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('loan_request.submitted_desc', 'Your loan request has been submitted successfully. A staff member will review your application and contact you soon.')}
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate(isAuthenticated ? '/client/dashboard' : '/')} className="flex-1">
                  {t('loan_request.go_to_home', 'Go to Home')}
                </Button>
                <Button onClick={() => { setSubmitted(false); form.reset(); }} variant="outline" className="flex-1">
                  {t('loan_request.submit_another', 'Submit Another')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(isAuthenticated ? '/client/dashboard' : '/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t('loan_request.title', 'Loan Request')}</h1>
            <p className="text-sm text-muted-foreground">{t('loan_request.subtitle', 'Submit a loan request application')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
          >
            <Languages className="h-4 w-4" />
            {currentLang === 'en' ? 'አማርኛ' : 'English'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('loan_request.form_title', 'Loan Request Information')}</CardTitle>
                <CardDescription>{t('loan_request.form_desc', 'Fill out the form to request a loan')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone (always visible, auto-filled from profile if authenticated) */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loan_request.fields.phone', 'Phone Number *')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+251911234567" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      {isAuthenticated && (
                        <p className="text-xs text-muted-foreground">
                          {t('loan_request.fields.phone_help', 'Phone number from your profile. You can edit if needed.')}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Loan Purpose */}
                <FormField
                  control={form.control}
                  name="loan_purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loan_request.fields.loan_purpose', 'Loan Purpose *')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('loan_request.fields.loan_purpose_placeholder', 'Select loan purpose')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CAR">{t('loan_request.purposes.CAR', 'Car')}</SelectItem>
                          <SelectItem value="HOUSE">{t('loan_request.purposes.HOUSE', 'House')}</SelectItem>
                          <SelectItem value="SCHOOL">{t('loan_request.purposes.SCHOOL', 'School')}</SelectItem>
                          <SelectItem value="CHILDREN">{t('loan_request.purposes.CHILDREN', 'Children')}</SelectItem>
                          <SelectItem value="BUSINESS">{t('loan_request.purposes.BUSINESS', 'Business')}</SelectItem>
                          <SelectItem value="MEDICAL">{t('loan_request.purposes.MEDICAL', 'Medical')}</SelectItem>
                          <SelectItem value="WEDDING">{t('loan_request.purposes.WEDDING', 'Wedding')}</SelectItem>
                          <SelectItem value="AGRICULTURE">{t('loan_request.purposes.AGRICULTURE', 'Agriculture')}</SelectItem>
                          <SelectItem value="OTHER">{t('loan_request.purposes.OTHER', 'Other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Other Purpose (only if OTHER is selected) */}
                {loanPurpose === 'OTHER' && (
                  <FormField
                    control={form.control}
                    name="other_purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('loan_request.fields.other_purpose', 'Please specify the loan purpose *')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('loan_request.fields.other_purpose_placeholder', 'Enter your loan purpose')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Requested Amount */}
                <FormField
                  control={form.control}
                  name="requested_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loan_request.fields.requested_amount', 'Requested Amount (ETB) *')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="50000"
                            className="pl-10"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4 pb-8">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <DollarSign className="mr-2 h-4 w-4 animate-spin" />
                    {t('loan_request.submitting', 'Submitting...')}
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    {t('loan_request.submit_request', 'Submit Loan Request')}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(isAuthenticated ? '/client/dashboard' : '/')} className="flex-1">
                {t('cancel', 'Cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}

