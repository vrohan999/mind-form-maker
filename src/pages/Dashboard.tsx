import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, LogOut, Eye, Link as LinkIcon, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Form {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  accepting_responses: boolean;
}

interface Submission {
  id: string;
  form_data: any;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchForms();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("forms")
        .update({ accepting_responses: !currentStatus })
        .eq("id", formId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Form is now ${!currentStatus ? "accepting" : "not accepting"} responses.`,
      });

      fetchForms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission deleted successfully.",
      });

      if (selectedForm) {
        fetchSubmissions(selectedForm.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Form link copied to clipboard.",
    });
  };

  const viewSubmissions = (form: Form) => {
    setSelectedForm(form);
    fetchSubmissions(form.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Mind Form Maker</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/create")} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Forms</h2>
          <p className="text-muted-foreground">Manage your forms and view submissions</p>
        </div>

        {forms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
              <p className="text-muted-foreground mb-4">Create your first AI-powered form</p>
              <Button onClick={() => navigate("/create")} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{form.title}</CardTitle>
                      {form.description && (
                        <CardDescription className="mt-2">{form.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={form.accepting_responses ? "default" : "secondary"}>
                      {form.accepting_responses ? "Active" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewSubmissions(form)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Submissions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyFormLink(form.id)}
                      className="gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFormStatus(form.id, form.accepting_responses)}
                      className="gap-2"
                    >
                      {form.accepting_responses ? (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Close Form
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Open Form
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm?.title} - Submissions</DialogTitle>
            <DialogDescription>
              View and manage form submissions ({submissions.length} total)
            </DialogDescription>
          </DialogHeader>

          {submissions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No submissions yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {new Date(submission.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <pre className="text-xs overflow-x-auto bg-muted p-2 rounded">
                          {JSON.stringify(submission.form_data, null, 2)}
                        </pre>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSubmission(submission.id)}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
