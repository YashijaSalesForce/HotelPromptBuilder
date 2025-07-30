// hotelPromptBuilder.js
import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getDesignInspiration from "@salesforce/apex/HotelPromptController.getDesignInspiration";

export default class HotelPromptBuilder extends LightningElement {
  @track results = []; // 생성된 결과들을 저장하는 배열
  @track isGenerating = false; // 로딩 상태
  @track error = ""; // 에러 메시지
  @track showWelcome = true; // 환영 메시지 표시 여부

  // 자식 컴포넌트에서 생성 요청이 오면 처리
  handleGenerate(event) {
    const formData = event.detail;
    this.generateAIResult(formData);
  }

  // 자식 컴포넌트에서 에러가 발생하면 처리
  handleError(event) {
    this.error = event.detail.message;
  }

  async generateAIResult(formData) {
    this.isGenerating = true;
    this.error = "";
    this.showWelcome = false;

    try {
      // 컨텍스트 생성
      const context = this.buildContext(formData);

      console.log("Calling AI with parameters:", {
        UX: formData.persona,
        context: context,
        coreQuestion: formData.coreQuestion,
        outputFormat: formData.outputFormat
      });

      // AI 호출
      const aiResponse = await getDesignInspiration({
        UX: formData.persona,
        context: context,
        coreQuestion: formData.coreQuestion,
        outputFormat: formData.outputFormat
      });

      // 결과 추가 (최신 결과가 맨 위에 오도록)
      const newResult = {
        id: Date.now(), // 고유 ID
        title: `${formData.persona}의 디자인 아이디어`,
        generatedPrompt: this.buildPromptText(
          formData.persona,
          context,
          formData.coreQuestion,
          formData.outputFormat
        ),
        aiResponse: aiResponse,
        parsedSections: this.parseAIResponseToSections(aiResponse), // 구조적으로 파싱된 섹션들
        persona: formData.persona,
        outputFormat: formData.outputFormat,
        timestamp: new Date().toLocaleString("ko-KR"),
        projectSummary: this.buildProjectSummary(formData)
      };

      this.results = [newResult, ...this.results];

      // 성공 토스트 메시지
      this.dispatchEvent(
        new ShowToastEvent({
          title: "성공",
          message: "AI 디자인 아이디어가 생성되었습니다!",
          variant: "success"
        })
      );
    } catch (error) {
      console.error("AI 호출 에러:", error);
      this.error = `AI 결과 생성 중 오류가 발생했습니다: ${error.body?.message || error.message}`;

      // 에러 토스트 메시지
      this.dispatchEvent(
        new ShowToastEvent({
          title: "오류",
          message: this.error,
          variant: "error"
        })
      );
    } finally {
      this.isGenerating = false;
    }
  }

  // 컨텍스트 문자열 생성
  buildContext(formData) {
    const contextParts = [];

    if (formData.hotelConcept) {
      contextParts.push(`호텔 컨셉/등급: ${formData.hotelConcept}`);
    }
    if (formData.location) {
      contextParts.push(`위치: ${formData.location}`);
    }
    if (formData.scale) {
      contextParts.push(`규모: ${formData.scale}`);
    }
    if (formData.target) {
      contextParts.push(`핵심 타겟 고객: ${formData.target}`);
    }

    return contextParts.join(", ");
  }

  // 프롬프트 텍스트 생성 (사용자에게 보여주기 위한)
  buildPromptText(persona, context, coreQuestion, outputFormat) {
    return `당신은 ${persona}입니다. 

프로젝트 배경: ${context}

핵심 질문: ${coreQuestion}

다음 형식으로 답변해주세요: ${outputFormat}`;
  }

  // 프로젝트 요약 생성
  buildProjectSummary(formData) {
    if (formData.hotelConcept) {
      return formData.hotelConcept;
    }
    if (formData.location) {
      return formData.location;
    }
    return "호텔 프로젝트";
  }

  // AI 응답을 구조적인 섹션으로 파싱
  parseAIResponseToSections(aiResponse) {
    if (!aiResponse) return [];

    const lines = aiResponse.split("\n").filter((line) => line.trim());
    const sections = [];
    let sectionId = 1;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // 제목 감지 (## 또는 ### 형식)
      const titleMatch = trimmedLine.match(/^(#{2,3})\s*(.+)$/);
      if (titleMatch) {
        sections.push({
          id: sectionId++,
          type: "title",
          isTitle: true,
          content: titleMatch[2],
          isNumbered: false,
          isBullet: false,
          isText: false
        });
        return;
      }

      // 번호 목록 감지 (1. 2. 3. 형식)
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
      if (numberedMatch) {
        sections.push({
          id: sectionId++,
          type: "numbered",
          isNumbered: true,
          number: numberedMatch[1],
          content: numberedMatch[2],
          isTitle: false,
          isBullet: false,
          isText: false
        });
        return;
      }

      // 불릿 포인트 감지 (- 또는 * 형식)
      const bulletMatch = trimmedLine.match(/^[-*]\s*(.+)$/);
      if (bulletMatch) {
        sections.push({
          id: sectionId++,
          type: "bullet",
          isBullet: true,
          content: bulletMatch[1],
          isTitle: false,
          isNumbered: false,
          isText: false
        });
        return;
      }

      // 일반 텍스트
      sections.push({
        id: sectionId++,
        type: "text",
        isText: true,
        content: this.formatInlineText(trimmedLine),
        isTitle: false,
        isNumbered: false,
        isBullet: false
      });
    });

    return sections;
  }

  // 인라인 텍스트 포매팅 (굵게, 이탤릭 등)
  formatInlineText(text) {
    // **굵게** 텍스트 처리 - 실제로는 그냥 텍스트로 반환 (LWC에서 HTML 제한)
    text = text.replace(/\*\*(.+?)\*\*/g, "$1");
    // *이탤릭* 텍스트 처리
    text = text.replace(/\*(.+?)\*/g, "$1");
    return text;
  }
}
