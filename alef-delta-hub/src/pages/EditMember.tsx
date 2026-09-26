import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { User, Member } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModernHeader } from "@/components/shared/ModernHeader";

// Password is optional for editing
const editMemberSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  middle_name: z.string().min(2, "Middle name must be at least 2 characters").optional().or(z.literal("")),
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
  member_type: z.enum(["GOV_EMP", "TRADER", "NGO", "FARMER", "SELF"]),
  monthly_income: z.string().min(1, "Monthly income is required"),
  tin_number: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

// Transform backend data to frontend format
function transformMemberToForm(member: Member): Partial<EditMemberFormData> {
  // Transform gender: MALE -> M, FEMALE -> F
  let gender: "M" | "F" = "M";
  if (member.gender === "FEMALE") {
    gender = "F";
  } else if (member.gender === "MALE") {
    gender = "M";
  }

  // Transform member_type: Backend -> Frontend format
  // SME -> TRADER, INDIVIDUAL -> SELF (default), keep others as is
  let member_type: "GOV_EMP" | "TRADER" | "NGO" | "FARMER" | "SELF" = "GOV_EMP";
  const backendType = member.member_type?.toUpperCase();
  if (backendType === "SME") {
    member_type = "TRADER";
  } else if (backendType === "INDIVIDUAL") {
    member_type = "SELF"; // Default INDIVIDUAL to SELF
  } else if (backendType === "GOV_EMP") {
    member_type = "GOV_EMP";
  } else if (backendType === "NGO") {
    member_type = "NGO";
  } else {
    // Default fallback
    member_type = "GOV_EMP";
  }

  return {
    first_name: member.first_name || "",
    middle_name: member.middle_name || "",
    last_name: member.last_name || "",
    phone_primary: member.phone_primary || "+251",
    email: member.email || "",
    gender,
    marital_status: member.marital_status as "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED",
    age: member.age?.toString() || "",
    family_size_female: member.family_size_female?.toString() || "0",
    family_size_male: member.family_size_male?.toString() || "0",
    educational_level: member.educational_level as "PRIMARY" | "SECONDARY" | "DIPLOMA" | "DEGREE" | "MASTERS" | "PHD" | "NONE" | undefined,
    occupation: member.occupation || "",
    work_experience_years: member.work_experience_years?.toString() || "",
    address_subcity: member.address_subcity || "",
    address_woreda: member.address_woreda || "",
    address_kebele: member.address_kebele || "",
    address_area_name: member.address_area_name || "",
    address_house_no: member.address_house_no || "",
    national_id_number: member.national_id_number || "",
    shares_requested: member.shares_requested?.toString() || "0",
    member_type,
    monthly_income: member.monthly_income?.toString() || "",
    tin_number: member.tin_number || "",
    password: "", // Don't pre-fill password
  };
}

const EditMember = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const res = await api.get<Member>(`/members/${id}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  const form = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
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
      shares_requested: "0",
      member_type: "GOV_EMP",
      monthly_income: "",
      tin_number: "",
      password: "",
    },
  });

  // Populate form when member data loads
  useEffect(() => {
    if (member) {
      const formData = transformMemberToForm(member);
      form.reset(formData);
    }
  }, [member, form]);

  const memberType = form.watch("member_type");

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
  if (isLoading) return <div className="p-8 text-center">Loading member data...</div>;
  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Member Not Found</CardTitle>
            <CardDescription>The requested member does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/members")}>Back to Members</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: EditMemberFormData) => {
    try {
      // Prepare payload - exclude password if empty
      const payload: any = {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        phone_primary: data.phone_primary,
        email: data.email || "",
        gender: data.gender,
        marital_status: data.marital_status,
        age: data.age ? Number(data.age) : null,
        family_size_female: data.family_size_female ? Number(data.family_size_female) : 0,
        family_size_male: data.family_size_male ? Number(data.family_size_male) : 0,
        educational_level: data.educational_level || null,
        occupation: data.occupation || null,
        work_experience_years: data.work_experience_years ? Number(data.work_experience_years) : null,
        address_subcity: data.address_subcity,
        address_woreda: data.address_woreda,
        address_kebele: data.address_kebele || null,
        address_area_name: data.address_area_name || null,
        address_house_no: data.address_house_no,
        national_id_number: data.national_id_number || null,
        shares_requested: data.shares_requested ? Number(data.shares_requested) : 0,
        member_type: data.member_type,
        monthly_income: Number(data.monthly_income),
        tin_number: data.tin_number || "",
      };

      // Only include password if it was provided
      if (data.password && data.password.trim() !== "") {
        payload.password = data.password;
      }

      await api.put(`/members/${id}`, payload);
    
      toast({
        title: "Member Updated Successfully",
        description: `${data.first_name} ${data.last_name}'s profile has been updated.`,
      });

      navigate(`/members/${id}`);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update member.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Edit Member Profile"
        subtitle="Update member information"
        onBack={() => navigate(`/members/${id}`)}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>
              Update the member's details. Leave password blank to keep current password.
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                            <Input type="number" placeholder="25" {...field} />
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
                            <Input type="number" placeholder="0" {...field} />
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
                            <Input type="number" placeholder="0" {...field} />
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
                            <Input type="number" placeholder="5" {...field} />
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
                      name="phone_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+251911234567" {...field} />
                          </FormControl>
                          <FormDescription>Format: +251XXXXXXXXX</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                          <FormLabel>Member Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                            <Input type="number" placeholder="25000" {...field} />
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
                          <FormLabel>Declared Share Intention (Historical / Informational)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
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
                          <FormLabel>New Password (Optional)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                          </FormControl>
                          <FormDescription>Min. 8 characters. Leave blank to keep current password.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/members/${id}`)}
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

export default EditMember;
