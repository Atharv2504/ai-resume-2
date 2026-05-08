import React, { useEffect, useState } from "react";
import {
  BtnBold,
  BtnBulletList,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnStrikeThrough,
  BtnUnderline,
  Editor,
  EditorProvider,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";
import { AIChatSession } from "@/Services/AiModel";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Sparkles, LoaderCircle } from "lucide-react";

const PROMPT = `Create a JSON object with the following fields:
"projectName": A string representing the project
"techStack":A string representing the project tech stack
"projectSummary": An array of strings, each representing a bullet point in html format describing relevant experience for the given project tittle and tech stack
projectName-"{projectName}"
techStack-"{techStack}"`;
function SimpeRichTextEditor({ index, onRichTextEditorChange, resumeInfo }) {
  const [value, setValue] = useState(
    resumeInfo?.projects[index]?.projectSummary || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onRichTextEditorChange(value);
  }, [value]);

  const GenerateSummaryFromAI = async () => {
    if (
      !resumeInfo?.projects[index]?.projectName ||
      !resumeInfo?.projects[index]?.techStack
    ) {
      toast("Add Project Name and Tech Stack to generate summary");
      return;
    }
    setLoading(true);
    try {
      const prompt = PROMPT.replace(
        "{projectName}",
        resumeInfo?.projects[index]?.projectName
      ).replace("{techStack}", resumeInfo?.projects[index]?.techStack);
      console.log("Prompt", prompt);
      const result = await AIChatSession.sendMessage(prompt);
      let responseText = result.response.text();
      
      // Remove markdown code fences if present
      if (responseText.includes("```json")) {
        responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      } else if (responseText.includes("```")) {
        responseText = responseText.replace(/```\n?/g, "").trim();
      }
      
      console.log("Cleaned response:", responseText);
      const resp = JSON.parse(responseText);
      console.log("Response", resp);
      await setValue(resp.projectSummary?.join(""));
      toast.success("Project summary generated successfully!");
    } catch (error) {
      console.error("Error generating project summary:", error);
      toast.error("Failed to generate project summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between my-2">
        <label className="text-xs">Summery</label>
        <Button
          variant="outline"
          size="sm"
          onClick={GenerateSummaryFromAI}
          disabled={loading}
          className="flex gap-2 border-primary text-primary"
        >
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate from AI
            </>
          )}
        </Button>
      </div>
      <EditorProvider>
        <Editor
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onRichTextEditorChange(value);
          }}
        >
          <Toolbar>
            <BtnBold />
            <BtnItalic />
            <BtnUnderline />
            <BtnStrikeThrough />
            <Separator />
            <BtnNumberedList />
            <BtnBulletList />
            <Separator />
            <BtnLink />
          </Toolbar>
        </Editor>
      </EditorProvider>
    </div>
  );
}

export default SimpeRichTextEditor;
