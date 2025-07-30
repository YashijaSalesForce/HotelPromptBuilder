import { LightningElement, track } from "lwc";

export default class HotelPromptInput extends LightningElement {
  @track persona = "";
  @track outputFormat = "";
  @track hotelConcept = "";
  @track location = "";
  @track scale = "";
  @track target = "";
  @track coreQuestion = "";

  get personaOptions() {
    return [
      { label: "디자인 전략가", value: "디자인 전략가" },
      { label: "트렌드 분석가", value: "트렌드 분석가" },
      { label: "사용자 경험(UX) 리서처", value: "사용자 경험(UX) 리서처" },
      {
        label: "상상력이 풍부한 공간 스토리텔러",
        value: "상상력이 풍부한 공간 스토리텔러"
      }
    ];
  }

  get formatOptions() {
    return [
      { label: "핵심 아이디어 리스트", value: "핵심 아이디어 리스트" },
      { label: "비교 분석표", value: "비교 분석표" },
      { label: "장단점 분석 (Pros & Cons)", value: "장단점 분석" },
      { label: "컨셉 내러티브", value: "컨셉 내러티브" }
    ];
  }

  handlePersonaChange(event) {
    this.persona = event.detail.value;
  }

  handleFormatChange(event) {
    this.outputFormat = event.detail.value;
  }

  handleConceptChange(event) {
    this.hotelConcept = event.detail.value;
  }

  handleLocationChange(event) {
    this.location = event.detail.value;
  }

  handleScaleChange(event) {
    this.scale = event.detail.value;
  }

  handleTargetChange(event) {
    this.target = event.detail.value;
  }

  handleQuestionChange(event) {
    this.coreQuestion = event.detail.value;
  }

  handleGenerateClick() {
    // 필수 필드 검증
    if (!this.persona || !this.outputFormat || !this.coreQuestion) {
      this.dispatchEvent(
        new CustomEvent("error", {
          detail: { message: "필수 필드를 모두 입력해주세요." }
        })
      );
      return;
    }

    // 부모 컴포넌트로 데이터 전송
    const formData = {
      persona: this.persona,
      outputFormat: this.outputFormat,
      hotelConcept: this.hotelConcept,
      location: this.location,
      scale: this.scale,
      target: this.target,
      coreQuestion: this.coreQuestion
    };

    this.dispatchEvent(
      new CustomEvent("generate", {
        detail: formData
      })
    );
  }
}
