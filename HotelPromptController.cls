/**
 * @description LWC(hotelPromptBuilder)에서 디자인팀의 요청을 받아
 * Einstein Prompt Template('GetIns')을 호출하고 그 결과를 반환하는 컨트롤러
 */
public with sharing class HotelPromptController {
  /**
   * @description LWC로부터 4개의 핵심 파라미터를 받아 AI 응답을 생성합니다.
   * @param UX '디자인 전략가' 등 LLM의 역할을 지정
   * @param context 프로젝트 배경, 타겟 고객 등 상세한 맥락 정보
   * @param coreQuestion 디자이너의 핵심 질문
   * @param outputFormat '핵심 아이디어 리스트' 등 원하는 결과물 형식
   * @return String LLM이 생성한 텍스트 응답
   */
  @AuraEnabled(
    cacheable=false
  ) // AI 호출은 서버 상태를 변경하므로 cacheable=false
  public static String getDesignInspiration(
    String UX,
    String context,
    String coreQuestion,
    String outputFormat
  ) {
    try {
      System.debug('=== 입력 파라미터 로깅 ===');
      System.debug('UX: ' + UX);
      System.debug('context: ' + context);
      System.debug('coreQuestion: ' + coreQuestion);
      System.debug('outputFormat: ' + outputFormat);

      // 먼저 GetIns 템플릿의 정확한 입력 변수들을 확인해보겠습니다
      // 임시로 빈 입력으로 호출해서 오류 메시지를 통해 필요한 파라미터를 파악합니다
      Map<String, ConnectApi.WrappedValue> testParams = new Map<String, ConnectApi.WrappedValue>();
      ConnectApi.EinsteinPromptTemplateGenerationsInput testInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
      testInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
      testInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';
      // 모델은 프롬프트 템플릿에서 설정된 것을 사용합니다
      testInput.isPreview = false;
      testInput.inputParams = testParams;

      try {
        ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
          'GetIns',
          testInput
        );
      } catch (Exception testEx) {
        System.debug(
          '템플릿 구조 확인을 위한 테스트 오류: ' + testEx.getMessage()
        );
      }

      // 1. LWC에서 받은 파라미터들을 Einstein API가 이해할 수 있는 형식으로 래핑합니다.
      Map<String, ConnectApi.WrappedValue> inputParams = new Map<String, ConnectApi.WrappedValue>();

      ConnectApi.WrappedValue UXValue = new ConnectApi.WrappedValue();
      UXValue.value = UX;

      ConnectApi.WrappedValue contextValue = new ConnectApi.WrappedValue();
      contextValue.value = context;

      ConnectApi.WrappedValue coreQuestionValue = new ConnectApi.WrappedValue();
      coreQuestionValue.value = coreQuestion;

      ConnectApi.WrappedValue outputFormatValue = new ConnectApi.WrappedValue();
      outputFormatValue.value = outputFormat;

      // 2. 래핑된 값들을 Map에 담습니다.
      //    다양한 가능한 이름들을 시도해봅시다
      System.debug('=== 시도할 파라미터 이름들 ===');

      // 프롬프트 빌더 이미지에서 확인한 정확한 파라미터 이름들 사용
      // Input:UX, Input:context, Input:core_question, Input:output_format
      inputParams.put('Input:UX', UXValue);
      inputParams.put('Input:context', contextValue);
      inputParams.put('Input:core_question', coreQuestionValue);
      inputParams.put('Input:output_format', outputFormatValue);

      // 대안: Input: 접두사 없이 시도해볼 수도 있음
      // inputParams.put('UX', UXValue);
      // inputParams.put('context', contextValue);
      // inputParams.put('core_question', coreQuestionValue);
      // inputParams.put('output_format', outputFormatValue);

      System.debug('입력 파라미터 Map: ' + inputParams);

      // 3. 프롬프트 템플릿 호출을 위한 설정을 구성합니다.
      ConnectApi.EinsteinPromptTemplateGenerationsInput executeTemplateInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
      executeTemplateInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
      executeTemplateInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable'; // Salesforce 표준 애플리케이션 이름
      // 모델은 프롬프트 템플릿에서 설정된 것을 사용합니다
      executeTemplateInput.isPreview = false;
      executeTemplateInput.inputParams = inputParams;

      // 4. Einstein LLM API를 호출하여 우리가 만든 프롬프트 템플릿('GetIns')을 실행합니다.
      ConnectApi.EinsteinPromptTemplateGenerationsRepresentation generationsOutput = ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
        'GetIns', // 프롬프트 템플릿의 API 이름
        executeTemplateInput
      );

      // 5. 생성된 응답 중 첫 번째 결과의 텍스트를 LWC로 반환합니다.
      ConnectApi.EinsteinLLMGenerationItemOutput response = generationsOutput.generations[0];
      return response.text;
    } catch (Exception e) {
      // 오류 발생 시, LWC에서 처리할 수 있도록 AuraHandledException을 발생시킵니다.
      System.debug('Error details: ' + e.getMessage());
      System.debug('Error type: ' + e.getTypeName());
      System.debug('Stack trace: ' + e.getStackTraceString());

      throw new AuraHandledException(
        'AI 결과 생성 중 오류 발생: ' +
          e.getMessage() +
          ' | Error Type: ' +
          e.getTypeName()
      );
    }
  }
}
