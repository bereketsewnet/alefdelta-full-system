// Self-Registration Page for Members
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Upload, X, Plus, Trash2, Eye, EyeOff, RefreshCw, CheckCircle2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

// Schema will be created inside component to access translations
type RegistrationFormData = {
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_primary: string;
  email?: string;
  gender: "M" | "F";
  marital_status: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  age?: string;
  family_size_female?: string;
  family_size_male?: string;
  educational_level?: "PRIMARY" | "SECONDARY" | "DIPLOMA" | "DEGREE" | "MASTERS" | "PHD" | "NONE";
  occupation?: string;
  work_experience_years?: string;
  address_subcity: string;
  address_woreda: string;
  address_kebele?: string;
  address_area_name?: string;
  address_house_no: string;
  national_id_number?: string;
  shares_requested?: string;
  terms_accepted: boolean;
  member_type: "GOV_EMP" | "TRADER" | "NGO" | "FARMER" | "SELF";
  monthly_income: string;
  tin_number?: string;
  password: string;
};

interface EmergencyContact {
  full_name: string;
  subcity: string;
  woreda: string;
  kebele: string;
  house_number: string;
  phone_number: string;
  relationship: string;
}

interface Beneficiary {
  full_name: string;
  relationship: string;
  phone: string;
  profile_photo_url?: string;
  id_front_url?: string;
  id_back_url?: string;
}

interface Document {
  document_type: 'KEBELE_ID' | 'DRIVER_LICENSE' | 'PASSPORT' | 'WORKER_ID' | 'REGISTRATION_RECEIPT';
  document_number?: string;
  front_photo_url?: string;
  back_photo_url?: string;
}

export default function SelfRegister() {
  const navigate = useNavigate();
  const { t, i18n: i18nInstance } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18nInstance.language || 'en');
  
  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'am' : 'en';
    i18nInstance.changeLanguage(newLang);
    setCurrentLang(newLang);
  };
  const [ageInput, setAgeInput] = useState<string>("");
  const [familySizeFemaleInput, setFamilySizeFemaleInput] = useState<string>("0");
  const [familySizeMaleInput, setFamilySizeMaleInput] = useState<string>("0");
  const [workExperienceInput, setWorkExperienceInput] = useState<string>("");
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState<string>("");
  const [sharesRequestedInput, setSharesRequestedInput] = useState<string>("10");
  
  // Emergency contacts state
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyContactForm, setEmergencyContactForm] = useState<EmergencyContact>({
    full_name: '',
    subcity: '',
    woreda: '',
    kebele: '',
    house_number: '',
    phone_number: '',
    relationship: ''
  });
  
  // Beneficiaries state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [beneficiaryForm, setBeneficiaryForm] = useState<Beneficiary>({
    full_name: '',
    relationship: '',
    phone: ''
  });
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // ID Card state (separate from documents)
  const [idCardFrontUrl, setIdCardFrontUrl] = useState<string>('');
  const [idCardBackUrl, setIdCardBackUrl] = useState<string>('');
  const [idCardPreviews, setIdCardPreviews] = useState<{ front?: string; back?: string }>({});
  
  // File refs
  const idCardFrontRef = useRef<HTMLInputElement>(null);
  const idCardBackRef = useRef<HTMLInputElement>(null);
  const kebeleIdFrontRef = useRef<HTMLInputElement>(null);
  const kebeleIdBackRef = useRef<HTMLInputElement>(null);
  const driverLicenseRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLInputElement>(null);
  const workerIdRef = useRef<HTMLInputElement>(null);
  const registrationReceiptRef = useRef<HTMLInputElement>(null);
  
  // File previews
  const [filePreviews, setFilePreviews] = useState<{
    [key: string]: string[];
  }>({});

  // Create schema with translations (inside component to access t function)
  const registrationSchema = z.object({
    // Basic Information
    first_name: z.string().min(2, t('validation.required')),
    middle_name: z.string().min(2, t('validation.required')),
    last_name: z.string().min(2, t('validation.required')),
    phone_primary: z.string().regex(/^\+251\d{9}$/, t('validation.invalid_phone')),
    email: z.string().email(t('validation.invalid_email')).optional().or(z.literal("")),
    gender: z.enum(["M", "F"]),
    marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]),
    age: z.string().optional().or(z.literal("")),
    family_size_female: z.string().optional().or(z.literal("")),
    family_size_male: z.string().optional().or(z.literal("")),
    educational_level: z.enum(["PRIMARY", "SECONDARY", "DIPLOMA", "DEGREE", "MASTERS", "PHD", "NONE"]).optional(),
    occupation: z.string().optional().or(z.literal("")),
    work_experience_years: z.string().optional().or(z.literal("")),
    // Address
    address_subcity: z.string().min(2, t('validation.required')),
    address_woreda: z.string().min(2, t('validation.required')),
    address_kebele: z.string().optional().or(z.literal("")),
    address_area_name: z.string().optional().or(z.literal("")),
    address_house_no: z.string().min(1, t('validation.required')),
    national_id_number: z.string().optional().or(z.literal("")),
    shares_requested: z.string().optional().or(z.literal("")),
    terms_accepted: z.boolean().refine(val => val === true, t('validation.required')),
    member_type: z.enum(["GOV_EMP", "TRADER", "NGO", "FARMER", "SELF"]),
    monthly_income: z.string().min(1, t('validation.required')),
    tin_number: z.string().optional(),
    password: z.string().min(8, t('validation.password_min_length')),
  });

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      phone_primary: "+251",
      email: "",
      gender: "M",
      marital_status: "SINGLE",
      age: "",
      family_size_female: "0",
      family_size_male: "0",
      educational_level: undefined,
      occupation: "",
      work_experience_years: "",
      address_subcity: "",
      address_woreda: "",
      address_kebele: "",
      address_area_name: "",
      address_house_no: "",
      national_id_number: "",
      shares_requested: "10",
      terms_accepted: false,
      member_type: "GOV_EMP",
      monthly_income: "",
      tin_number: "",
      password: "",
    },
  });

  const memberType = form.watch("member_type");

  // Password generator
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const allChars = uppercase + lowercase + numbers;
    
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    const length = 8 + Math.floor(Math.random() * 5);
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setValue("password", newPassword);
  };

  // File upload handler
  const handleFileUpload = async (file: File, type: string): Promise<string> => {
    try {
      const response = await api.uploads.upload(file, type);
      return response.url;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  };

  // Delete document
  const handleDeleteDocument = (documentType: Document['document_type'], side: 'front' | 'back') => {
    setDocuments(prev => {
      const existing = prev.find(d => d.document_type === documentType);
      if (existing) {
        const updated = { ...existing };
        if (side === 'front') {
          delete updated.front_photo_url;
        } else {
          delete updated.back_photo_url;
        }
        // Remove document if both sides are empty
        if (!updated.front_photo_url && !updated.back_photo_url) {
          return prev.filter(d => d.document_type !== documentType);
        }
        return prev.map(d => d.document_type === documentType ? updated : d);
      }
      return prev;
    });
    
    // Clear previews
    setFilePreviews(prev => {
      const key = `${documentType}_${side}`;
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
    
    toast({
      title: t('registration.messages.document_removed'),
      description: t('registration.messages.document_removed_desc'),
    });
  };

  // Get image URL for preview
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
    return `${apiBaseUrl.replace(/\/api\/?$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Handle ID Card upload (separate from documents)
  const handleIdCardUpload = async (
    side: 'front' | 'back',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const file = files[0]; // ID Card is single file
      const url = await handleFileUpload(file, 'document');
      
      if (side === 'front') {
        setIdCardFrontUrl(url);
      } else {
        setIdCardBackUrl(url);
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardPreviews(prev => ({
          ...prev,
          [side]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);

      toast({
        title: t('registration.messages.id_card_uploaded'),
        description: t('registration.messages.id_card_uploaded_desc'),
      });
    } catch (error: any) {
      console.error('ID Card upload error:', error);
      toast({
        title: t('registration.messages.upload_failed'),
        description: error.message || t('registration.messages.upload_failed_id_card'),
        variant: "destructive",
      });
    }
  };

  // Handle document file selection
  const handleDocumentFileChange = async (
    documentType: Document['document_type'],
    side: 'front' | 'back',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      // Upload all files
      const uploadPromises = files.map(file => handleFileUpload(file, 'document'));
      const urls = await Promise.all(uploadPromises);
      
      // For multiple uploads, we'll store the first URL in the document
      // and could extend this to store multiple URLs if needed
      const primaryUrl = urls[0];
      
      // Update documents array
      setDocuments(prev => {
        const existing = prev.find(d => d.document_type === documentType);
        if (existing) {
          return prev.map(d => 
            d.document_type === documentType
              ? { 
                  ...d, 
                  [side === 'front' ? 'front_photo_url' : 'back_photo_url']: primaryUrl,
                  // Store all URLs in a metadata field if needed
                  _urls: { ...d._urls, [side]: urls }
                }
              : d
          );
        } else {
          return [...prev, {
            document_type: documentType,
            [side === 'front' ? 'front_photo_url' : 'back_photo_url']: primaryUrl,
            _urls: { [side]: urls }
          }];
        }
      });

      // Create previews
      const previewPromises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      const previews = await Promise.all(previewPromises);
      
      setFilePreviews(prev => ({
        ...prev,
        [`${documentType}_${side}`]: previews
      }));

      toast({
        title: t('registration.messages.file_uploaded'),
        description: t('registration.messages.file_uploaded_desc', { count: files.length }),
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: t('registration.messages.upload_failed'),
        description: error.message || t('registration.messages.upload_failed_file'),
        variant: "destructive",
      });
    }
  };

  // Emergency contact handlers
  const addEmergencyContact = () => {
    if (!emergencyContactForm.full_name || !emergencyContactForm.phone_number) {
      toast({
        title: t('error'),
        description: t('registration.fields.full_name') + ' ' + t('registration.fields.phone_number') + ' ' + t('validation.required'),
        variant: "destructive",
      });
      return;
    }
    setEmergencyContacts([...emergencyContacts, { ...emergencyContactForm }]);
    setEmergencyContactForm({
      full_name: '',
      subcity: '',
      woreda: '',
      kebele: '',
      house_number: '',
      phone_number: '',
      relationship: ''
    });
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  // Beneficiary handlers
  const addBeneficiary = () => {
    if (!beneficiaryForm.full_name || !beneficiaryForm.phone) {
      toast({
        title: t('error'),
        description: t('registration.fields.full_name') + ' ' + t('registration.fields.phone_number') + ' ' + t('validation.required'),
        variant: "destructive",
      });
      return;
    }
    setBeneficiaries([...beneficiaries, { ...beneficiaryForm }]);
    setBeneficiaryForm({
      full_name: '',
      relationship: '',
      phone: ''
    });
  };

  const removeBeneficiary = (index: number) => {
    setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare member data payload
      const memberData: any = {
        first_name: data.first_name,
        middle_name: data.middle_name || '', // Backend expects string, not null
        last_name: data.last_name,
        phone_primary: data.phone_primary,
        email: data.email || '',
        gender: data.gender,
        marital_status: data.marital_status,
        age: data.age && data.age.trim() !== "" ? Number(data.age) : null,
        family_size_female: data.family_size_female && data.family_size_female.trim() !== "" ? Number(data.family_size_female) : 0,
        family_size_male: data.family_size_male && data.family_size_male.trim() !== "" ? Number(data.family_size_male) : 0,
        educational_level: data.educational_level || '',
        occupation: data.occupation && data.occupation.trim() !== "" ? data.occupation : '',
        work_experience_years: data.work_experience_years && data.work_experience_years.trim() !== "" ? Number(data.work_experience_years) : null,
        address_subcity: data.address_subcity || '',
        address_woreda: data.address_woreda || '',
        address_kebele: data.address_kebele && data.address_kebele.trim() !== "" ? data.address_kebele : '',
        address_area_name: data.address_area_name && data.address_area_name.trim() !== "" ? data.address_area_name : '',
        address_house_no: data.address_house_no || '',
        national_id_number: data.national_id_number && data.national_id_number.trim() !== "" ? data.national_id_number : '',
        shares_requested: data.shares_requested && data.shares_requested.trim() !== "" ? Number(data.shares_requested) : 0,
        terms_accepted: data.terms_accepted === true,
        member_type: data.member_type,
        monthly_income: Number(data.monthly_income),
        tin_number: data.tin_number && data.tin_number.trim() !== "" ? data.tin_number : '',
        password: data.password,
        // ID Card URLs (separate from documents)
        id_card_front_url: idCardFrontUrl || '',
        id_card_back_url: idCardBackUrl || '',
      };

      // Add emergency contacts
      if (emergencyContacts.length > 0) {
        memberData.emergency_contacts = emergencyContacts;
      }

      // Add beneficiaries
      if (beneficiaries.length > 0) {
        memberData.beneficiaries = beneficiaries;
      }

      // Add documents (clean up _urls metadata before sending)
      if (documents.length > 0) {
        memberData.documents = documents.map(doc => {
          const { _urls, ...cleanDoc } = doc;
          return cleanDoc;
        });
      }

      // Submit registration request
      await api.public.createRegistrationRequest(memberData);

      setSubmitted(true);
      toast({
        title: t('registration.submitted_title'),
        description: t('registration.submitted_desc'),
      });
    } catch (error: any) {
      let errorMessage = t('registration.messages.submit_failed');
      
      // Try to extract detailed error message
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((detail: any) => {
            const field = detail.path?.join('.') || detail.context?.label || 'field';
            return `${field}: ${detail.message}`;
          }).join(', ');
          errorMessage = t('registration.messages.validation_failed', { errors: validationErrors });
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Registration error:', error);
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
              <h2 className="text-2xl font-bold mb-2">{t('registration.submitted_title')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('registration.submitted_desc')}
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/auth/login')} className="flex-1">
                  {t('registration.go_to_login')}
                </Button>
                <Button onClick={() => { setSubmitted(false); form.reset(); }} variant="outline" className="flex-1">
                  {t('registration.submit_another')}
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
            <h1 className="text-xl font-bold">{t('registration.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('registration.subtitle')}</p>
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.personal_info')}</CardTitle>
                <CardDescription>{t('registration.personal_info_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.first_name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Abebe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middle_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.middle_name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Kebede" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.last_name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Tesfaye" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.gender')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('registration.fields.gender')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">{t('registration.genders.M')}</SelectItem>
                            <SelectItem value="F">{t('registration.genders.F')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.age')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="25"
                            value={ageInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*$/.test(value)) {
                                setAgeInput(value);
                                if (value === "") {
                                  form.setValue("age", "", { shouldValidate: false });
                                } else {
                                  const numValue = parseInt(value);
                                  if (!isNaN(numValue)) {
                                    form.setValue("age", value, { shouldValidate: true });
                                  }
                                }
                              }
                            }}
                            onBlur={() => {
                              if (ageInput && !isNaN(parseInt(ageInput))) {
                                form.setValue("age", ageInput, { shouldValidate: true });
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marital_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.marital_status')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('registration.fields.marital_status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SINGLE">{t('registration.marital_statuses.SINGLE')}</SelectItem>
                            <SelectItem value="MARRIED">{t('registration.marital_statuses.MARRIED')}</SelectItem>
                            <SelectItem value="DIVORCED">{t('registration.marital_statuses.DIVORCED')}</SelectItem>
                            <SelectItem value="WIDOWED">{t('registration.marital_statuses.WIDOWED')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="educational_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.educational_level')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('registration.fields.educational_level')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PRIMARY">{t('registration.educational_levels.PRIMARY')}</SelectItem>
                            <SelectItem value="SECONDARY">{t('registration.educational_levels.SECONDARY')}</SelectItem>
                            <SelectItem value="DIPLOMA">{t('registration.educational_levels.DIPLOMA')}</SelectItem>
                            <SelectItem value="DEGREE">{t('registration.educational_levels.DEGREE')}</SelectItem>
                            <SelectItem value="MASTERS">{t('registration.educational_levels.MASTERS')}</SelectItem>
                            <SelectItem value="PHD">{t('registration.educational_levels.PHD')}</SelectItem>
                            <SelectItem value="NONE">{t('registration.educational_levels.NONE')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="family_size_female"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.family_size_female')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={familySizeFemaleInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*$/.test(value)) {
                                setFamilySizeFemaleInput(value);
                                if (value === "") {
                                  form.setValue("family_size_female", "0", { shouldValidate: false });
                                } else {
                                  form.setValue("family_size_female", value, { shouldValidate: true });
                                }
                              }
                            }}
                            onBlur={() => {
                              if (familySizeFemaleInput && !isNaN(parseInt(familySizeFemaleInput))) {
                                form.setValue("family_size_female", familySizeFemaleInput, { shouldValidate: true });
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="family_size_male"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.family_size_male')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={familySizeMaleInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*$/.test(value)) {
                                setFamilySizeMaleInput(value);
                                if (value === "") {
                                  form.setValue("family_size_male", "0", { shouldValidate: false });
                                } else {
                                  form.setValue("family_size_male", value, { shouldValidate: true });
                                }
                              }
                            }}
                            onBlur={() => {
                              if (familySizeMaleInput && !isNaN(parseInt(familySizeMaleInput))) {
                                form.setValue("family_size_male", familySizeMaleInput, { shouldValidate: true });
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.contact_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone_primary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.phone_primary')}</FormLabel>
                        <FormControl>
                          <Input placeholder="+251911234567" {...field} />
                        </FormControl>
                        <FormDescription>{t('registration.fields.phone_format')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.email')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="member@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.address_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address_subcity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.address_subcity')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Arada" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_woreda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.address_woreda')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Woreda 05" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address_kebele"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.address_kebele')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Kebele" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_area_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.address_area_name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Area name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address_house_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.address_house_no')}</FormLabel>
                        <FormControl>
                          <Input placeholder="H-123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="national_id_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.national_id_number')}</FormLabel>
                        <FormControl>
                          <Input placeholder="ID Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.financial_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="member_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.member_type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('registration.fields.member_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GOV_EMP">{t('registration.member_types.GOV_EMP')}</SelectItem>
                            <SelectItem value="TRADER">{t('registration.member_types.TRADER')}</SelectItem>
                            <SelectItem value="NGO">{t('registration.member_types.NGO')}</SelectItem>
                            <SelectItem value="FARMER">{t('registration.member_types.FARMER')}</SelectItem>
                            <SelectItem value="SELF">{t('registration.member_types.SELF')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthly_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.monthly_income')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="25000"
                            value={monthlyIncomeInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*$/.test(value)) {
                                setMonthlyIncomeInput(value);
                                if (value === "") {
                                  form.setValue("monthly_income", "", { shouldValidate: false });
                                } else {
                                  form.setValue("monthly_income", value, { shouldValidate: true });
                                }
                              }
                            }}
                            onBlur={() => {
                              if (monthlyIncomeInput && !isNaN(parseInt(monthlyIncomeInput))) {
                                form.setValue("monthly_income", monthlyIncomeInput, { shouldValidate: true });
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {memberType === "TRADER" && (
                  <FormField
                    control={form.control}
                    name="tin_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.tin_number')}</FormLabel>
                        <FormControl>
                          <Input placeholder="TIN-123456789" {...field} />
                        </FormControl>
                        <FormDescription>{t('registration.fields.tin_desc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.occupation')}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Teacher, Trader" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="work_experience_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('registration.fields.work_experience_years')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="5"
                            value={workExperienceInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*$/.test(value)) {
                                setWorkExperienceInput(value);
                                if (value === "") {
                                  form.setValue("work_experience_years", "", { shouldValidate: false });
                                } else {
                                  form.setValue("work_experience_years", value, { shouldValidate: true });
                                }
                              }
                            }}
                            onBlur={() => {
                              if (workExperienceInput && !isNaN(parseInt(workExperienceInput))) {
                                form.setValue("work_experience_years", workExperienceInput, { shouldValidate: true });
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shares_requested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registration.fields.shares_requested')}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={sharesRequestedInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*$/.test(value)) {
                              setSharesRequestedInput(value);
                              if (value === "") {
                                form.setValue("shares_requested", "0", { shouldValidate: false });
                              } else {
                                form.setValue("shares_requested", value, { shouldValidate: true });
                              }
                            }
                          }}
                          onBlur={() => {
                            if (sharesRequestedInput && !isNaN(parseInt(sharesRequestedInput))) {
                              form.setValue("shares_requested", sharesRequestedInput, { shouldValidate: true });
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>{t('registration.fields.shares_requested_desc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.emergency_contact')}</CardTitle>
                <CardDescription>{t('registration.emergency_contact_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('registration.fields.full_name')}</Label>
                    <Input
                      placeholder="Full name"
                      value={emergencyContactForm.full_name}
                      onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('registration.fields.phone_number')}</Label>
                    <Input
                      placeholder="+251911234567"
                      value={emergencyContactForm.phone_number}
                      onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, phone_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('registration.fields.subcity')}</Label>
                    <Input
                      placeholder="Subcity"
                      value={emergencyContactForm.subcity}
                      onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, subcity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('registration.fields.woreda')}</Label>
                    <Input
                      placeholder="Woreda"
                      value={emergencyContactForm.woreda}
                      onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, woreda: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('registration.fields.kebele')}</Label>
                    <Input
                      placeholder="Kebele"
                      value={emergencyContactForm.kebele}
                      onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, kebele: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('registration.fields.house_number')}</Label>
                    <Input
                      placeholder="House number"
                      value={emergencyContactForm.house_number}
                      onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, house_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('registration.fields.relationship')}</Label>
                    <Input
                      placeholder="e.g., Spouse, Parent"
                      value={emergencyContactForm.relationship}
                      onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, relationship: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={addEmergencyContact} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('registration.add_emergency_contact')}
                </Button>

                {emergencyContacts.length > 0 && (
                  <div className="space-y-2">
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{contact.full_name}</p>
                          <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmergencyContact(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Beneficiaries */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.beneficiary')}</CardTitle>
                <CardDescription>{t('registration.beneficiary_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('registration.fields.full_name')}</Label>
                    <Input
                      placeholder="Full name"
                      value={beneficiaryForm.full_name}
                      onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('registration.fields.relationship')}</Label>
                    <Input
                      placeholder="e.g., Spouse, Child"
                      value={beneficiaryForm.relationship}
                      onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, relationship: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('registration.fields.phone_number')}</Label>
                    <Input
                      placeholder="+251911234567"
                      value={beneficiaryForm.phone}
                      onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={addBeneficiary} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('registration.add_beneficiary')}
                </Button>

                {beneficiaries.length > 0 && (
                  <div className="space-y-2">
                    {beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{beneficiary.full_name}</p>
                          <p className="text-sm text-muted-foreground">{beneficiary.relationship} - {beneficiary.phone}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBeneficiary(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.documents')}</CardTitle>
                <CardDescription>{t('registration.documents_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ID Card */}
                <div>
                  <Label className="mb-2 block">{t('registration.fields.id_card_front')}</Label>
                  <div className="flex gap-2 mb-2">
                    <input
                      ref={idCardFrontRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleIdCardUpload('front', e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => idCardFrontRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {t('registration.fields.upload_front')}
                    </Button>
                  </div>
                  {(idCardFrontUrl || idCardPreviews.front) && (
                    <div className="mt-2">
                      <div className="relative group inline-block">
                        <img 
                          src={idCardPreviews.front || getImageUrl(idCardFrontUrl)} 
                          alt="ID Card Front" 
                          className="w-48 h-32 object-cover rounded-lg border" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setIdCardFrontUrl('');
                            setIdCardPreviews(prev => ({ ...prev, front: undefined }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kebele ID */}
                <div>
                  <Label className="mb-2 block">{t('registration.fields.kebele_id')}</Label>
                  <div className="flex gap-2 mb-2">
                    <input
                      ref={kebeleIdFrontRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleDocumentFileChange('KEBELE_ID', 'front', e)}
                    />
                    <input
                      ref={kebeleIdBackRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleDocumentFileChange('KEBELE_ID', 'back', e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => kebeleIdFrontRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {t('registration.fields.upload_front')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => kebeleIdBackRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {t('registration.fields.upload_back')}
                    </Button>
                  </div>
                  {(() => {
                    const doc = documents.find(d => d.document_type === 'KEBELE_ID');
                    const frontPreviews = filePreviews['KEBELE_ID_front'] || [];
                    const backPreviews = filePreviews['KEBELE_ID_back'] || [];
                    const frontUrl = doc?.front_photo_url;
                    const backUrl = doc?.back_photo_url;
                    const hasImages = (frontUrl || frontPreviews.length > 0) || (backUrl || backPreviews.length > 0);
                    return hasImages && (
                      <div className="mt-2 space-y-2">
                        {(frontUrl || frontPreviews.length > 0) && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Front</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {frontPreviews.map((preview, idx) => (
                                <div key={idx} className="relative group">
                                  <img src={preview} alt="Front Preview" className="w-full h-32 object-cover rounded-lg border" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteDocument('KEBELE_ID', 'front')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              {frontUrl && frontPreviews.length === 0 && (
                                <div className="relative group">
                                  <img src={getImageUrl(frontUrl)} alt="Front" className="w-full h-32 object-cover rounded-lg border" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteDocument('KEBELE_ID', 'front')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {(backUrl || backPreviews.length > 0) && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Back</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {backPreviews.map((preview, idx) => (
                                <div key={idx} className="relative group">
                                  <img src={preview} alt="Back Preview" className="w-full h-32 object-cover rounded-lg border" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteDocument('KEBELE_ID', 'back')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              {backUrl && backPreviews.length === 0 && (
                                <div className="relative group">
                                  <img src={getImageUrl(backUrl)} alt="Back" className="w-full h-32 object-cover rounded-lg border" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteDocument('KEBELE_ID', 'back')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Helper function to render document preview */}
                {(() => {
                  const renderDocumentPreview = (
                    documentType: Document['document_type'],
                    side: 'front' | 'back' = 'front',
                    label: string
                  ) => {
                    const doc = documents.find(d => d.document_type === documentType);
                    const previewKey = `${documentType}_${side}`;
                    const previews = filePreviews[previewKey] || [];
                    const url = doc?.[side === 'front' ? 'front_photo_url' : 'back_photo_url'];
                    const hasImages = url || previews.length > 0;
                    
                    return (
                      <div>
                        <Label className="mb-2 block">{label}</Label>
                        <div className="flex gap-2 mb-2">
                          <input
                            ref={documentType === 'DRIVER_LICENSE' ? driverLicenseRef : 
                                 documentType === 'PASSPORT' ? passportRef :
                                 documentType === 'WORKER_ID' ? workerIdRef :
                                 registrationReceiptRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleDocumentFileChange(documentType, side, e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const ref = documentType === 'DRIVER_LICENSE' ? driverLicenseRef : 
                                         documentType === 'PASSPORT' ? passportRef :
                                         documentType === 'WORKER_ID' ? workerIdRef :
                                         registrationReceiptRef;
                              ref.current?.click();
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </Button>
                        </div>
                        {hasImages && (
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {previews.map((preview, idx) => (
                              <div key={idx} className="relative group">
                                <img src={preview} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteDocument(documentType, side)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {url && previews.length === 0 && (
                              <div className="relative group">
                                <img src={getImageUrl(url)} alt="Uploaded" className="w-full h-32 object-cover rounded-lg border" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteDocument(documentType, side)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  };
                  
                  return (
                    <>
                      {/* Driver License */}
                      {renderDocumentPreview('DRIVER_LICENSE', 'front', t('registration.fields.driver_license'))}

                      {/* Passport */}
                      {renderDocumentPreview('PASSPORT', 'front', t('registration.fields.passport'))}

                      {/* Worker ID */}
                      {renderDocumentPreview('WORKER_ID', 'front', t('registration.fields.worker_id'))}

                      {/* Registration Receipts */}
                      <div>
                        <Label className="mb-2 block">{t('registration.fields.registration_receipt')}</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          {t('registration.fields.registration_receipt_desc')}
                        </p>
                        <div className="flex gap-2 mb-2">
                          <input
                            ref={registrationReceiptRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleDocumentFileChange('REGISTRATION_RECEIPT', 'front', e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => registrationReceiptRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {t('registration.fields.upload_receipts')}
                          </Button>
                        </div>
                        {(() => {
                          const doc = documents.find(d => d.document_type === 'REGISTRATION_RECEIPT');
                          const previews = filePreviews['REGISTRATION_RECEIPT_front'] || [];
                          const url = doc?.front_photo_url;
                          return (url || previews.length > 0) && (
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                              {previews.map((preview, idx) => (
                                <div key={idx} className="relative group">
                                  <img src={preview} alt="Receipt Preview" className="w-full h-32 object-cover rounded-lg border" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteDocument('REGISTRATION_RECEIPT', 'front')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              {url && previews.length === 0 && (
                                <div className="relative group">
                                  <img src={getImageUrl(url)} alt="Receipt" className="w-full h-32 object-cover rounded-lg border" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteDocument('REGISTRATION_RECEIPT', 'front')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Password */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.account_password')}</CardTitle>
                <CardDescription>{t('registration.account_password_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registration.fields.password')}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGeneratePassword}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            {t('registration.fields.generate')}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>{t('registration.fields.password_min')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('registration.declaration')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/50 mb-4">
                  <p className="text-sm">
                    {t('registration.terms_text')}
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="terms_accepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="mt-1 h-4 w-4"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          {t('registration.accept_terms')}
                        </FormLabel>
                        <FormMessage />
                      </div>
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
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t('registration.submitting')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('registration.submit_request')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
