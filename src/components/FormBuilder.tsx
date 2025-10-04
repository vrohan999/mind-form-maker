import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DynamicForm from "./DynamicForm";
import ClarificationDialog from "./ClarificationDialog";

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
  type: 'form' | 'clarification';
  title?: string;
  description?: string;
  fields?: FormField[];
  contradiction?: string;
  questions?: string[];
}

export default function FormBuilder() {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [showClarification, setShowClarification] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);

  const generateForm = async () => {
    if (!description.trim()) {
      toast.error("Please describe the form you want to create");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-form', {
        body: { description }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error("Failed to generate form. Please try again.");
        return;
      }

      console.log('Generated schema:', data);
      setFormSchema(data);

      if (data.type === 'clarification') {
        setShowClarification(true);
        toast.info("We need some clarification about your form");
      } else {
        // Save form to database for sharing
        const { data: savedForm, error: saveError } = await supabase
          .from('forms')
          .insert({
            title: data.title || 'Untitled Form',
            description: data.description || '',
            schema: data
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving form:', saveError);
          toast.error("Form generated but couldn't create shareable link");
        } else {
          setFormId(savedForm.id);
          toast.success("Form generated successfully!");
        }
      }
    } catch (error) {
      console.error('Error generating form:', error);
      toast.error("An error occurred while generating the form");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClarificationSubmit = (answers: string[]) => {
    const updatedDescription = `${description}\n\nClarifications:\n${answers.join('\n')}`;
    setDescription(updatedDescription);
    setShowClarification(false);
    setFormSchema(null);
    // Auto-regenerate with clarifications
    setTimeout(() => generateForm(), 100);
  };

  const handleFormReset = () => {
    setFormSchema(null);
    setDescription("");
    setFormId(null);
  };

  const handleCopyLink = () => {
    if (formId) {
      const shareUrl = `${window.location.origin}/form/${formId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dynamic Form Builder
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your form in natural language, and watch AI build it instantly
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Panel - Input */}
          <Card className="p-6 space-y-6 shadow-strong animate-scale-in">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span className="text-3xl">✍️</span>
                Describe Your Form
              </h2>
              <p className="text-sm text-muted-foreground">
                Tell us what fields you need. Be as detailed as you like!
              </p>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Example: Create a form for new club members with name, email, favorite anime, and membership tier (basic, premium, elite)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[200px] resize-none text-base"
                disabled={isGenerating}
              />

              <div className="bg-accent/10 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">💡 Pro Tips:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Include field types (email, phone, text, etc.)</li>
                  <li>• Mention required vs optional fields</li>
                  <li>• Add dropdown options if needed</li>
                  <li>• AI will detect contradictions and ask for clarity</li>
                </ul>
              </div>

              <Button
                onClick={generateForm}
                disabled={isGenerating || !description.trim()}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Form...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Form
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Right Panel - Preview */}
          <Card className="p-6 shadow-strong animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">👁️</span>
                  <h2 className="text-2xl font-semibold">Live Preview</h2>
                </div>
                {formSchema?.type === 'form' && formId && (
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <span className="text-lg">🔗</span>
                    Copy Link
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Your form will appear here in real-time
              </p>
            </div>

            {formSchema?.type === 'form' ? (
              <DynamicForm schema={formSchema} onReset={handleFormReset} />
            ) : (
              <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-muted rounded-lg">
                <div className="text-center space-y-3 p-8">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg font-medium text-muted-foreground">
                    No form yet
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Describe your form on the left and click "Generate Form" to see it here
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Clarification Dialog */}
      {formSchema?.type === 'clarification' && (
        <ClarificationDialog
          open={showClarification}
          onOpenChange={setShowClarification}
          contradiction={formSchema.contradiction || ""}
          questions={formSchema.questions || []}
          onSubmit={handleClarificationSubmit}
        />
      )}
    </div>
  );
}