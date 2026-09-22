import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { useAccountProducts } from "@/hooks/use-account-products";
import {
  DEFAULT_SAVINGS_PRODUCT_CODES,
  isSimpleSavingsProduct,
  SavingsAccountSelector,
} from "@/components/members/SavingsAccountSelector";

const memberSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  middle_name: z.string().min(2, "Middle name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  phone_primary: z.string().regex(/^\+251\d{9}$/, "Phone must be in format +251XXXXXXXXX"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gender: z.enum(["M", "F"]),
  marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]),
  age: z.string().optional().or(z.literal("")),
  family_size_female: z.string().optional().or(z.literal("")),
  family_size_male: z.string().optional().or(z.literal("")),
  educational_level: z.enum(["PRIMARY", "SECONDARY", "DIPLOMA", "DEGREE", "MASTERS", "PHD", "NONE"]).optional(),
  occupation: z.string().optional().or(z.literal("")),
  work_experience_years: z.string().optional().or(z.literal("")),
  address_subcity: z.string().min(2, "Subcity is required"),
  address_woreda: z.string().min(2, "Woreda is required"),
  address_kebele: z.string().optional().or(z.literal("")),
  address_area_name: z.string().optional().or(z.literal("")),
  address_house_no: z.string().min(1, "House number is required"),
  national_id_number: z.string().optional().or(z.literal("")),
  shares_requested: z.string().optional().or(z.literal("")),
  terms_accepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  member_type: z.enum(["GOV_EMP", "TRADER", "NGO", "FARMER", "SELF"]),
  monthly_income: z.string().min(1, "Monthly income is required"),
  tin_number: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Emergency contact fields
  emergency_contact_full_name: z.string().optional().or(z.literal("")),
  emergency_contact_subcity: z.string().optional().or(z.literal("")),
  emergency_contact_woreda: z.string().optional().or(z.literal("")),
  emergency_contact_kebele: z.string().optional().or(z.literal("")),
  emergency_contact_house_number: z.string().optional().or(z.literal("")),
  emergency_contact_phone_number: z.string().optional().or(z.literal("")),
  emergency_contact_relationship: z.string().optional().or(z.literal("")),
});

type MemberFormData = z.infer<typeof memberSchema>;

const NewMember = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [ageInput, setAgeInput] = useState<string>("");
  const [familySizeFemaleInput, setFamilySizeFemaleInput] = useState<string>("0");
  const [familySizeMaleInput, setFamilySizeMaleInput] = useState<string>("0");
  const [workExperienceInput, setWorkExperienceInput] = useState<string>("");
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState<string>("");
  const [sharesRequestedInput, setSharesRequestedInput] = useState<string>("10");
  const [selectedAccountProductCodes, setSelectedAccountProductCodes] = useState<string[]>([]);
  const accountDefaultsInitializedRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
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
      emergency_contact_full_name: "",
      emergency_contact_subcity: "",
      emergency_contact_woreda: "",
      emergency_contact_kebele: "",
      emergency_contact_house_number: "",
      emergency_contact_phone_number: "",
      emergency_contact_relationship: "",
    },
  });

  const memberType = form.watch("member_type");
  const { data: accountProducts = [] } = useAccountProducts(Boolean(user));

  useEffect(() => {
    if (accountDefaultsInitializedRef.current || accountProducts.length === 0) return;
    const availableDefaults = DEFAULT_SAVINGS_PRODUCT_CODES.filter((code) =>
      accountProducts.some((product) => product.product_code === code && isSimpleSavingsProduct(product))
    );
    accountDefaultsInitializedRef.current = true;
    setSelectedAccountProductCodes(availableDefaults);
  }, [accountProducts]);

  const handleAccountProductSelectionChange = (productCodes: string[]) => {
    // Once the officer changes the selection, never reapply defaults over that choice.
    accountDefaultsInitializedRef.current = true;
    setSelectedAccountProductCodes(productCodes);
  };

  // Password generator function
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const allChars = uppercase + lowercase + numbers;
    
    // Ensure at least one of each required type
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    // Fill the rest randomly (total length 8-12 characters)
    const length = 8 + Math.floor(Math.random() * 5); // 8-12 characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize position of required characters
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setValue("password", newPassword);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (!["TELLER", "MANAGER", "ADMIN"].includes(userData.role)) {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  if (!user) return null;

  const onSubmit = async (data: MemberFormData) => {
    try {
      // Prepare member payload
      const memberPayload: any = {
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        phone_primary: data.phone_primary,
        email: data.email || null,
        gender: data.gender,
        marital_status: data.marital_status,
        age: data.age && data.age.trim() !== "" ? Number(data.age) : null,
        family_size_female: data.family_size_female && data.family_size_female.trim() !== "" ? Number(data.family_size_female) : 0,
        family_size_male: data.family_size_male && data.family_size_male.trim() !== "" ? Number(data.family_size_male) : 0,
        educational_level: data.educational_level || null,
        occupation: data.occupation && data.occupation.trim() !== "" ? data.occupation : null,
        work_experience_years: data.work_experience_years && data.work_experience_years.trim() !== "" ? Number(data.work_experience_years) : null,
        address_subcity: data.address_subcity || null,
        address_woreda: data.address_woreda || null,
        address_kebele: data.address_kebele && data.address_kebele.trim() !== "" ? data.address_kebele : null,
        address_area_name: data.address_area_name && data.address_area_name.trim() !== "" ? data.address_area_name : null,
        address_house_no: data.address_house_no || null,
        national_id_number: data.national_id_number && data.national_id_number.trim() !== "" ? data.national_id_number : null,
        shares_requested: data.shares_requested && data.shares_requested.trim() !== "" ? Number(data.shares_requested) : 0,
        terms_accepted: data.terms_accepted === true, // Must be exactly true
        member_type: data.member_type,
        monthly_income: Number(data.monthly_income),
        tin_number: data.tin_number && data.tin_number.trim() !== "" ? data.tin_number : null,
        password: data.password,
        account_product_codes: selectedAccountProductCodes,
      };

      // Create member
      const memberResponse = await api.post('/members', memberPayload);
      const memberId = memberResponse.data.member_id;

      // Create emergency contact if provided
      if (data.emergency_contact_full_name && data.emergency_contact_phone_number) {
        try {
          await api.post(`/emergency-contacts/member/${memberId}`, {
            full_name: data.emergency_contact_full_name,
            subcity: data.emergency_contact_subcity || null,
            woreda: data.emergency_contact_woreda || null,
            kebele: data.emergency_contact_kebele || null,
            house_number: data.emergency_contact_house_number || null,
            phone_number: data.emergency_contact_phone_number,
            relationship: data.emergency_contact_relationship || null,
          });
        } catch (error: any) {
          console.error("Failed to create emergency contact:", error);
          // Don't fail the whole registration if emergency contact fails
        }
      }
    
      toast({
        title: "Member Created Successfully",
        description: `${data.first_name} ${data.last_name} has been registered.`,
      });

      navigate("/members");
    } catch (error: any) {
      let errorMessage = "Failed to create member.";
      
      if (error.response?.data) {
        // Handle validation errors
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          const validationErrors = error.response.data.details.map((detail: any) => {
            const field = detail.path?.join('.') || detail.context?.label || 'field';
            return `${field}: ${detail.message}`;
          }).join(', ');
          errorMessage = `Validation failed: ${validationErrors}`;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      console.error('Registration error:', error.response?.data || error);
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="New Member Registration"
        subtitle="Create a new member account"
        onBack={() => navigate("/members")}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>
              Enter the details of the new member. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
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
                          <FormLabel>Middle Name *</FormLabel>
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
                          <FormLabel>Last Name *</FormLabel>
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
                          <FormLabel>Gender *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Male</SelectItem>
                              <SelectItem value="F">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="marital_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SINGLE">Single</SelectItem>
                              <SelectItem value="MARRIED">Married</SelectItem>
                              <SelectItem value="DIVORCED">Divorced</SelectItem>
                              <SelectItem value="WIDOWED">Widowed</SelectItem>
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
                          <FormLabel>Age</FormLabel>
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
                      name="family_size_female"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Family Size - Female</FormLabel>
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
                          <FormLabel>Family Size - Male</FormLabel>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="educational_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Educational Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select educational level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PRIMARY">Primary</SelectItem>
                              <SelectItem value="SECONDARY">Secondary</SelectItem>
                              <SelectItem value="DIPLOMA">Diploma</SelectItem>
                              <SelectItem value="DEGREE">Degree</SelectItem>
                              <SelectItem value="MASTERS">Masters</SelectItem>
                              <SelectItem value="PHD">PhD</SelectItem>
                              <SelectItem value="NONE">None</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Occupation</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Teacher, Trader" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="work_experience_years"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Experience (Years)</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="national_id_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>National ID Card Number</FormLabel>
                          <FormControl>
                            <Input placeholder="ID Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="member@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Residential Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address_subcity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub-City *</FormLabel>
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
                          <FormLabel>Woreda *</FormLabel>
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
                          <FormLabel>Kebele</FormLabel>
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
                          <FormLabel>Specific Location / Area Name</FormLabel>
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
                          <FormLabel>House Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="H-123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+251911234567" {...field} />
                          </FormControl>
                          <FormDescription>Format: +251XXXXXXXXX</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Emergency Contact Person */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact Person</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergency_contact_full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+251911234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergency_contact_subcity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub-City</FormLabel>
                          <FormControl>
                            <Input placeholder="Subcity" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_woreda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Woreda</FormLabel>
                          <FormControl>
                            <Input placeholder="Woreda" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="emergency_contact_kebele"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kebele</FormLabel>
                          <FormControl>
                            <Input placeholder="Kebele" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_house_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Number</FormLabel>
                          <FormControl>
                            <Input placeholder="House number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Spouse, Parent" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="member_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Occupation *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="GOV_EMP">Government Employee</SelectItem>
                              <SelectItem value="TRADER">Trader</SelectItem>
                              <SelectItem value="NGO">NGO Employee</SelectItem>
                              <SelectItem value="FARMER">Farmer</SelectItem>
                              <SelectItem value="SELF">Self Employed</SelectItem>
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
                          <FormLabel>Monthly Income (ETB) *</FormLabel>
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
                          <FormLabel>TIN Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="TIN-123456789" {...field} />
                          </FormControl>
                          <FormDescription>Required for traders</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shares_requested"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Shares Requested</FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Password *</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="Enter initial password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  title={showPassword ? "Hide password" : "Show password"}
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
                                title="Generate secure password"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Generate
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>Min. 8 characters (must include uppercase, lowercase, and number)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <SavingsAccountSelector
                  products={accountProducts}
                  selectedCodes={selectedAccountProductCodes}
                  onSelectedCodesChange={handleAccountProductSelectionChange}
                />

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Declaration</h3>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm mb-4">
                      I, the undersigned applicant, hereby declare that I fully understand the objectives and activities 
                      of the Cooperative Society and agree to comply with all the rules and regulations stipulated in 
                      its bylaws. Accordingly, I respectfully request to be accepted as a member of the Cooperative Society.
                    </p>
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
                              I accept the terms and conditions *
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? "Creating Member..." : "Create Member"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/members")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewMember;
