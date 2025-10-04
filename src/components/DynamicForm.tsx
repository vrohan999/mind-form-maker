import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required: boolean;
  validation?: {
    pattern?: string;
    message?: string;
  };
  options?: string[];
}

interface FormSchema {
  title?: string;
  description?: string;
  fields?: FormField[];
}

interface DynamicFormProps {
  schema: FormSchema;
  onReset: () => void;
  formId?: string;
}

export default function DynamicForm({ schema, onReset, formId }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateField = (field: FormField, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (value && field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return field.validation.message || `Invalid ${field.label}`;
      }
    }

    // Built-in validation for common types
    if (value && field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email address';
      }
    }

    if (value && field.type === 'tel') {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return 'Invalid phone number';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    schema.fields?.forEach(field => {
      const error = validateField(field, formData[field.id] || '');
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('form_submissions')
        .insert({
          form_title: schema.title || 'Untitled Form',
          form_data: formData,
          form_id: formId || null
        });

      if (error) throw error;

      toast.success("Form submitted successfully!");
      setSubmitted(true);
      setFormData({});
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.id];
    const value = formData[field.id] || '';

    const commonProps = {
      id: field.id,
      required: field.required,
      className: hasError ? 'border-destructive' : '',
    };

    switch (field.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleChange(field.id, val)}>
            <SelectTrigger {...commonProps}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={4}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <CheckCircle2 className="w-16 h-16 mx-auto text-primary" />
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Form Submitted!</h3>
          <p className="text-muted-foreground">
            Your response has been recorded successfully
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Submit Another
          </Button>
          <Button onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">{schema.title || 'Generated Form'}</h3>
        {schema.description && (
          <p className="text-muted-foreground">{schema.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {schema.fields?.map(field => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            {renderField(field)}
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New Form
        </Button>
      </div>
    </form>
  );
}