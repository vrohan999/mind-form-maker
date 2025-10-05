import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DynamicForm from "@/components/DynamicForm";

interface FormSchema {
  type: 'form';
  title: string;
  description?: string;
  fields: Array<{
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
  }>;
}

export default function SharedForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) {
        toast.error("Invalid form link");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching form:', error);
          toast.error("Failed to load form");
          return;
        }

        if (!data) {
          toast.error("Form not found");
          return;
        }

        if (!data.accepting_responses) {
          toast.error("This form is no longer accepting responses");
        }

        setFormSchema(data.schema as unknown as FormSchema);
      } catch (error) {
        console.error('Error:', error);
        toast.error("An error occurred while loading the form");
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleReset = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!formSchema) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-semibold">Form Not Found</h2>
          <p className="text-muted-foreground">
            The form you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card className="p-6 shadow-strong">
            <DynamicForm schema={formSchema} onReset={handleReset} formId={id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
