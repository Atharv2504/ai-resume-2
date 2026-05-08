import React, { useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDispatch } from "react-redux";
import { addResumeData } from "@/features/resume/resumeFeatures";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AIChatSession } from "@/Services/AiModel";
import { updateThisResume } from "@/Services/resumeAPI";

const prompt =
  "Job Title: {jobTitle} , Depends on job title give me list of  summery for 3 experience level, Mid Level and Freasher level in 3 -4 lines in array format, With summery and experience_level Field in JSON Format";
function Summary({ resumeInfo, enanbledNext, enanbledPrev }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false); // Declare the undeclared variable using useState
  const [summary, setSummary] = useState(resumeInfo?.summary || ""); // Declare the undeclared variable using useState
  const [aiGeneratedSummeryList, setAiGenerateSummeryList] = useState(null); // Declare the undeclared variable using useState
  const { resume_id } = useParams();

  const handleInputChange = (e) => {
    enanbledNext(false);
    enanbledPrev(false);
    dispatch(
      addResumeData({
        ...resumeInfo,
        [e.target.name]: e.target.value,
      })
    );
    setSummary(e.target.value);
  };

  const onSave = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Started Saving Summary");
    const data = {
      data: { summary },
    };
    if (resume_id) {
      updateThisResume(resume_id, data)
        .then((data) => {
          toast("Resume Updated", "success");
        })
        .catch((error) => {
          toast("Error updating resume", `${error.message}`);
        })
        .finally(() => {
          enanbledNext(true);
          enanbledPrev(true);
          setLoading(false);
        });
    }
  }; // Declare the undeclared variable using useState

  const setSummery = (summary) => {
    dispatch(
      addResumeData({
        ...resumeInfo,
        summary: summary,
      })
    );
    setSummary(summary);
  };

  const parseJsonFromAiText = (rawText) => {
    const text = (rawText || "").trim();
    const candidates = [text];

    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch?.[1]) candidates.push(codeBlockMatch[1].trim());

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      candidates.push(text.slice(firstBrace, lastBrace + 1));
    }

    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      candidates.push(text.slice(firstBracket, lastBracket + 1));
    }

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        // try next shape
      }
    }
    return null;
  };

  const normalizeSummaryList = (rawText) => {
    const parsed = parseJsonFromAiText(rawText);
    if (!parsed) return [];

    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.summaries)
      ? parsed.summaries
      : Array.isArray(parsed?.summary_list)
      ? parsed.summary_list
      : Array.isArray(parsed?.data)
      ? parsed.data
      : parsed && typeof parsed === "object"
      ? [parsed]
      : [];

    return rawList
      .map((item, index) => {
        if (typeof item === "string") {
          return {
            summary: item,
            experience_level: `Option ${index + 1}`,
          };
        }
        if (!item || typeof item !== "object") return null;
        const summaryText =
          item.summary ||
          item.summery ||
          item.text ||
          item.content ||
          item.description ||
          "";
        const level =
          item.experience_level || item.level || item.experienceLevel || "General";
        if (!summaryText) return null;
        return { summary: summaryText, experience_level: level };
      })
      .filter(Boolean);
  };

  const GenerateSummeryFromAI = async () => {
    setLoading(true);
    console.log("Generate Summery From AI for", resumeInfo?.jobTitle);
    if (!resumeInfo?.jobTitle) {
      toast("Please Add Job Title");
      setLoading(false);
      return;
    }
    const PROMPT = prompt.replace("{jobTitle}", resumeInfo?.jobTitle);
    try {
      const result = await AIChatSession.sendMessage(PROMPT);
      const summaryList = normalizeSummaryList(result.response.text());
      if (!summaryList.length) {
        toast("AI response format was invalid. Please try again.");
        return;
      }
      setAiGenerateSummeryList(summaryList);
      toast("Summery Generated", "success");
    } catch (error) {
      console.log(error);
      toast("${error.message}", `${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="p-5 shadow-lg rounded-lg border-t-primary border-t-4 mt-10">
        <h2 className="font-bold text-lg">Summary</h2>
        <p>Add Summary for your job title</p>

        <form className="mt-7" onSubmit={onSave}>
          <div className="flex justify-between items-end">
            <label>Add Summery</label>
            <Button
              variant="outline"
              onClick={() => GenerateSummeryFromAI()}
              type="button"
              size="sm"
              className="border-primary text-primary flex gap-2"
            >
              <Sparkles className="h-4 w-4" /> Generate from AI
            </Button>
          </div>
          <Textarea
            name="summary"
            className="mt-5"
            required
            value={summary ? summary : resumeInfo?.summary}
            onChange={handleInputChange}
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </div>

      {Array.isArray(aiGeneratedSummeryList) && aiGeneratedSummeryList.length > 0 && (
        <div className="my-5">
          <h2 className="font-bold text-lg">Suggestions</h2>
          {aiGeneratedSummeryList?.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                enanbledNext(false);
                enanbledPrev(false);
                setSummery(item?.summary || "");
              }}
              className="p-5 shadow-lg my-4 rounded-lg cursor-pointer"
            >
              <h2 className="font-bold my-1 text-primary">
                Level: {item?.experience_level}
              </h2>
              <p>{item?.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Summary;
