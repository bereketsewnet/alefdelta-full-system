// Partner Registration Page
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Languages, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

type PartnerFormData = {
  name: string;
  company_name?: string;
  phone: string;
  request_type: 'PARTNERSHIP' | 'SPONSORSHIP';
  sponsorship_type?: 'PLATINUM' | 'GOLD' | 'SILVER';
};

export default function PartnerRegistration() {
  const navigate = useNavigate();
  const { t, i18n: i18nInstance, ready } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18nInstance.language || 'en');
  
  
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
  const partnerSchema = z.object({
    name: z.string().min(2, t('validation.required', 'This field is required')),
    company_name: z.string().optional().or(z.literal("")),
    phone: z.string().regex(/^\+251\d{9}$/, t('validation.invalid_phone', 'Please enter a valid phone number')),
    request_type: z.enum(['PARTNERSHIP', 'SPONSORSHIP']),
    sponsorship_type: z.enum(['PLATINUM', 'GOLD', 'SILVER']).optional(),
  }).refine((data) => {
    if (data.request_type === 'SPONSORSHIP') {
      return !!data.sponsorship_type;
    }
    return true;
  }, {
    message: t('partner_registration.validation.sponsorship_type_required', 'Sponsorship type is required when selecting Sponsorship'),
    path: ['sponsorship_type'],
  });

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      company_name: "",
      phone: "+251",
      request_type: "PARTNERSHIP",
      sponsorship_type: undefined,
    },
  });

  const requestType = form.watch("request_type");

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        phone: data.phone,
        request_type: data.request_type,
      };

      if (data.company_name && data.company_name.trim() !== "") {
        payload.company_name = data.company_name;
      }

      if (data.request_type === 'SPONSORSHIP' && data.sponsorship_type) {
        payload.sponsorship_type = data.sponsorship_type;
      }

      await api.public.createPartnerRequest(payload);

      setSubmitted(true);
      toast({
        title: t('partner_registration.submitted_title', 'Corporate Request Submitted'),
        description: t('partner_registration.submitted_desc', 'Your corporate request has been submitted successfully. A staff member will review your application and contact you soon.'),
      });
    } catch (error: any) {
      let errorMessage = t('partner_registration.messages.submit_failed', 'Failed to submit corporate request.');
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((detail: any) => {
            const field = detail.path?.join('.') || detail.context?.label || 'field';
            return `${field}: ${detail.message}`;
          }).join(', ');
          errorMessage = t('partner_registration.messages.validation_failed', 'Validation failed: {{errors}}', { 
            defaultValue: 'Validation failed: {{errors}}',
            errors: validationErrors 
          });
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Partner registration error:', error);
      toast({
        title: t('error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
              <h2 className="text-2xl font-bold mb-2">{t('partner_registration.submitted_title', 'Corporate Request Submitted')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('partner_registration.submitted_desc', 'Your corporate request has been submitted successfully. A staff member will review your application and contact you soon.')}
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/')} className="flex-1">
                  {t('partner_registration.go_to_home', 'Go to Home')}
                </Button>
                <Button onClick={() => { setSubmitted(false); form.reset(); }} variant="outline" className="flex-1">
                  {t('partner_registration.submit_another', 'Submit Another')}
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t('partner_registration.title', 'Corporate Registration')}</h1>
            <p className="text-sm text-muted-foreground">{t('partner_registration.subtitle', 'Fill out the form to request partnership or sponsorship')}</p>
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
                <CardTitle>{t('partner_registration.form_title', 'Corporate Information')}</CardTitle>
                <CardDescription>{t('partner_registration.form_desc', 'Enter your details to become a partner or sponsor')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partner_registration.fields.name', 'Name *')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('partner_registration.fields.name_placeholder', 'Enter your full name')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Name (Optional) */}
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partner_registration.fields.company_name', 'Company Name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('partner_registration.fields.company_name_placeholder', 'Enter company name (optional)')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partner_registration.fields.phone', 'Phone Number *')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+251911234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Request Type */}
                <FormField
                  control={form.control}
                  name="request_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partner_registration.fields.request_type', 'Request Type *')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('partner_registration.fields.request_type', 'Request Type *')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PARTNERSHIP">{t('partner_registration.request_types.PARTNERSHIP', 'Partnership')}</SelectItem>
                          <SelectItem value="SPONSORSHIP">{t('partner_registration.request_types.SPONSORSHIP', 'Sponsorship')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sponsorship Type (only show if SPONSORSHIP is selected) */}
                {requestType === 'SPONSORSHIP' && (
                  <FormField
                    control={form.control}
                    name="sponsorship_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partner_registration.fields.sponsorship_type', 'Sponsorship Type *')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('partner_registration.fields.sponsorship_type_placeholder', 'Select sponsorship type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PLATINUM">{t('partner_registration.sponsorship_types.PLATINUM', 'Platinum Sponsor')}</SelectItem>
                            <SelectItem value="GOLD">{t('partner_registration.sponsorship_types.GOLD', 'Gold Sponsor')}</SelectItem>
                            <SelectItem value="SILVER">{t('partner_registration.sponsorship_types.SILVER', 'Silver Sponsor')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>{t('partner_registration.need_help', 'Need Help?')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('partner_registration.contact_desc', 'Contact our support team for any assistance with your request.')}
                </p>
                <a
                  href="tel:+251988888000"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors font-medium"
                >
                  <Phone className="h-4 w-4" />
                  <span>{t('partner_registration.contact_support', 'Contact Support')}</span>
                </a>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4 pb-8">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <UserPlus className="mr-2 h-4 w-4 animate-spin" />
                    {t('partner_registration.submitting', 'Submitting...')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('partner_registration.submit_request', 'Submit Corporate Request')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                {t('cancel', 'Cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}



