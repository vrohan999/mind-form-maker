import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface ClarificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contradiction: string;
  questions: string[];
  onSubmit: (answers: string[]) => void;
}

export default function ClarificationDialog({
  open,
  onOpenChange,
  contradiction,
  questions,
  onSubmit,
}: ClarificationDialogProps) {
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ''));

  const handleSubmit = () => {
    if (answers.some(answer => !answer.trim())) {
      return;
    }
    onSubmit(answers);
    setAnswers(questions.map(() => ''));
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-5 w-5 text-primary" />
            Clarification Needed
          </DialogTitle>
          <DialogDescription className="text-base">
            We detected a potential contradiction in your form description
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-accent/10 p-4 rounded-lg">
            <p className="font-medium mb-2">Issue Detected:</p>
            <p className="text-sm text-muted-foreground">{contradiction}</p>
          </div>

          <div className="space-y-4">
            <p className="font-medium">Please answer these questions:</p>
            {questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`question-${index}`} className="text-base">
                  {index + 1}. {question}
                </Label>
                <Textarea
                  id={`question-${index}`}
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Your answer..."
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={answers.some(answer => !answer.trim())}
          >
            Continue with Clarifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}