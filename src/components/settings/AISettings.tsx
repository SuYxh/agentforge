import { useState, useMemo, useCallback } from "react";
import {
  CheckIcon,
  RefreshCwIcon,
  PlayIcon,
  Loader2Icon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  EditIcon,
  SearchIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  testAIConnection,
  testImageGeneration,
  fetchAvailableModels,
  getApiEndpointPreview,
  getImageApiEndpointPreview,
  AITestResult,
  ImageTestResult,
  ModelInfo,
} from "@/services/ai";
import { useSettingsStore } from "@/stores/settings.store";
import { useToast } from "@/components/ui/Toast";
import { getCategoryIcon } from "@/components/ui/ModelIcons";
import { SettingSection, PasswordInput } from "./shared";

const AI_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    defaultUrl: "https://api.openai.com",
    group: "International / 国际",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "o3", "o3-mini", "o4-mini"],
  },
  {
    id: "google",
    name: "Google",
    defaultUrl: "https://generativelanguage.googleapis.com",
    group: "International / 国际",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultUrl: "https://api.anthropic.com",
    group: "International / 国际",
    models: ["claude-sonnet-4-20250514", "claude-3-7-sonnet-20250219", "claude-3-5-haiku-20241022"],
  },
  {
    id: "xai",
    name: "xAI",
    defaultUrl: "https://api.x.ai",
    group: "International / 国际",
    models: ["grok-3", "grok-3-mini", "grok-2"],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    defaultUrl: "https://api.mistral.ai",
    group: "International / 国际",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "codestral-latest"],
  },

  {
    id: "deepseek",
    name: "DeepSeek",
    defaultUrl: "https://api.deepseek.com",
    group: "Domestic / 国内",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "moonshot",
    name: "Moonshot",
    defaultUrl: "https://api.moonshot.cn",
    group: "Domestic / 国内",
    models: ["moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"],
  },
  {
    id: "zhipu",
    name: "智谱 AI",
    defaultUrl: "https://open.bigmodel.cn/api/paas",
    group: "Domestic / 国内",
    models: ["glm-4-plus", "glm-4-flash", "glm-4-long", "glm-4"],
  },
  {
    id: "qwen",
    name: "通义千问",
    defaultUrl: "https://dashscope.aliyuncs.com/compatible-mode",
    group: "Domestic / 国内",
    models: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen-long"],
  },
  {
    id: "ernie",
    name: "文心一言",
    defaultUrl: "https://qianfan.baidubce.com/v2",
    group: "Domestic / 国内",
    models: ["ernie-4.0-8k", "ernie-3.5-8k", "ernie-speed-8k", "ernie-lite-8k"],
  },
  {
    id: "spark",
    name: "讯飞星火",
    defaultUrl: "https://spark-api-open.xf-yun.com",
    group: "Domestic / 国内",
    models: ["spark-max", "spark-pro", "spark-lite"],
  },
  {
    id: "doubao",
    name: "豆包",
    defaultUrl: "https://ark.cn-beijing.volces.com/api",
    group: "Domestic / 国内",
    models: ["doubao-pro-256k", "doubao-pro-128k", "doubao-pro-32k", "doubao-lite-32k"],
  },
  {
    id: "baichuan",
    name: "百川智能",
    defaultUrl: "https://api.baichuan-ai.com",
    group: "Domestic / 国内",
    models: ["Baichuan4", "Baichuan3-Turbo", "Baichuan2-Turbo"],
  },
  {
    id: "minimax",
    name: "MiniMax",
    defaultUrl: "https://api.minimax.chat",
    group: "Domestic / 国内",
    models: ["MiniMax-Text-01", "abab6.5s-chat", "abab5.5-chat"],
  },
  {
    id: "stepfun",
    name: "阶跃星辰",
    defaultUrl: "https://api.stepfun.com",
    group: "Domestic / 国内",
    models: ["step-2-16k", "step-1-256k", "step-1-32k"],
  },
  {
    id: "yi",
    name: "零一万物 (Yi)",
    defaultUrl: "https://api.lingyiwanwu.com",
    group: "Domestic / 国内",
    models: ["yi-large", "yi-medium", "yi-spark"],
  },

  { id: "azure", name: "Azure OpenAI", defaultUrl: "", group: "Other / 其他", models: [] },
  {
    id: "ollama",
    name: "Ollama (本地)",
    defaultUrl: "http://localhost:11434",
    group: "Other / 其他",
    models: ["llama3.1", "llama3", "qwen2.5", "gemma2", "mistral", "codellama"],
  },
  {
    id: "custom",
    name: "自定义 (OpenAI 兼容)",
    defaultUrl: "",
    group: "Other / 其他",
    models: [],
  },
];

const AI_IMAGE_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    defaultUrl: "https://api.openai.com",
    group: "International / 国际",
    models: ["dall-e-3", "dall-e-2", "gpt-image-1"],
  },
  {
    id: "google",
    name: "Google",
    defaultUrl: "https://generativelanguage.googleapis.com",
    group: "International / 国际",
    models: ["imagen-3.0-generate-002", "imagen-3.0-generate-001"],
  },
  {
    id: "flux",
    name: "FLUX",
    defaultUrl: "https://api.bfl.ai",
    group: "International / 国际",
    models: ["flux-pro-1.1", "flux-pro", "flux-dev"],
  },
  {
    id: "ideogram",
    name: "Ideogram",
    defaultUrl: "https://api.ideogram.ai",
    group: "International / 国际",
    models: ["V_2", "V_2_TURBO"],
  },
  {
    id: "recraft",
    name: "Recraft",
    defaultUrl: "https://external.api.recraft.ai",
    group: "International / 国际",
    models: ["recraftv3"],
  },
  {
    id: "stability",
    name: "Stability AI",
    defaultUrl: "https://api.stability.ai",
    group: "International / 国际",
    models: ["stable-diffusion-xl-1024-v1-0", "stable-image-ultra", "stable-image-core"],
  },
  {
    id: "replicate",
    name: "Replicate",
    defaultUrl: "https://api.replicate.com",
    group: "International / 国际",
    models: [],
  },
  {
    id: "xai",
    name: "xAI",
    defaultUrl: "https://api.x.ai",
    group: "International / 国际",
    models: ["grok-2-image"],
  },

  { id: "azure", name: "Azure OpenAI", defaultUrl: "", group: "Other / 其他", models: [] },
  {
    id: "custom",
    name: "自定义 (OpenAI 兼容)",
    defaultUrl: "",
    group: "Other / 其他",
    models: [],
  },
];

const MODEL_CATEGORY_CONFIG: {
  category: string;
  idKeywords?: string[];
  ownerKeywords?: string[];
}[] = [
  {
    category: "GPT",
    idKeywords: ["gpt", "o1-", "o3-"],
    ownerKeywords: ["openai"],
  },
  {
    category: "Claude",
    idKeywords: ["claude"],
    ownerKeywords: ["anthropic"],
  },
  {
    category: "Gemini",
    idKeywords: ["gemini"],
    ownerKeywords: ["google", "vertexai"],
  },
  {
    category: "DeepSeek",
    idKeywords: ["deepseek"],
    ownerKeywords: ["deepseek"],
  },
  {
    category: "Qwen",
    idKeywords: ["qwen", "qwq"],
    ownerKeywords: ["qwen", "aliyun", "dashscope"],
  },
  {
    category: "Doubao",
    idKeywords: ["doubao"],
    ownerKeywords: ["doubao", "volcengine"],
  },
  { category: "GLM", idKeywords: ["glm", "zhipu"], ownerKeywords: ["zhipu"] },
  {
    category: "Moonshot",
    idKeywords: ["moonshot", "kimi"],
    ownerKeywords: ["moonshot"],
  },
  {
    category: "Llama",
    idKeywords: ["llama"],
    ownerKeywords: ["meta", "llama"],
  },
  {
    category: "Mistral",
    idKeywords: ["mistral", "mixtral"],
    ownerKeywords: ["mistral"],
  },
  {
    category: "Yi",
    idKeywords: ["yi-"],
    ownerKeywords: ["01-ai", "zeroone", "zero-one"],
  },
  {
    category: "ERNIE",
    idKeywords: ["ernie", "wenxin"],
    ownerKeywords: ["baidu", "wenxin"],
  },
  {
    category: "Spark",
    idKeywords: ["spark", "xunfei"],
    ownerKeywords: ["xunfei", "iflytek"],
  },
  {
    category: "Baichuan",
    idKeywords: ["baichuan"],
    ownerKeywords: ["baichuan"],
  },
  {
    category: "Hunyuan",
    idKeywords: ["hunyuan"],
    ownerKeywords: ["tencent"],
  },
  {
    category: "Minimax",
    idKeywords: ["minimax", "abab"],
    ownerKeywords: ["minimax"],
  },
  {
    category: "Stepfun",
    idKeywords: ["step-", "stepfun"],
    ownerKeywords: ["stepfun"],
  },
];

const CATEGORY_ORDER = [
  "GPT",
  "Claude",
  "Gemini",
  "DeepSeek",
  "Qwen",
  "Doubao",
  "GLM",
  "Moonshot",
  "Llama",
  "Mistral",
  "Yi",
  "ERNIE",
  "Spark",
  "Baichuan",
  "Embedding",
  "Audio",
  "Image",
  "Other",
];

const IMAGE_CATEGORY_ORDER = CATEGORY_ORDER.map((c) =>
  c === "Gemini" ? "nanobananai 🍌" : c,
);

const ALL_PROVIDERS = (() => {
  const map = new Map<string, { id: string; name: string; defaultUrl: string; group: string }>();
  for (const p of AI_PROVIDERS) {
    map.set(p.id, { id: p.id, name: p.name, defaultUrl: p.defaultUrl, group: p.group });
  }
  for (const p of AI_IMAGE_PROVIDERS) {
    if (!map.has(p.id)) {
      map.set(p.id, { id: p.id, name: p.name, defaultUrl: p.defaultUrl, group: p.group });
    }
  }
  return Array.from(map.values());
})();

const PROVIDER_ID_TO_CATEGORY: Record<string, string> = {
  openai: "GPT",
  google: "Gemini",
  anthropic: "Claude",
  deepseek: "DeepSeek",
  moonshot: "Moonshot",
  zhipu: "GLM",
  qwen: "Qwen",
  doubao: "Doubao",
  mistral: "Mistral",
  baichuan: "Baichuan",
  yi: "Yi",
  ernie: "ERNIE",
  spark: "Spark",
  xai: "Other",
  flux: "Other",
  ideogram: "Other",
  recraft: "Other",
  stability: "Other",
  replicate: "Other",
  minimax: "Minimax",
  stepfun: "Stepfun",
  azure: "Other",
  ollama: "Other",
  custom: "Other",
};

const PROVIDER_GROUP_ORDER = [
  "International / 国际",
  "Domestic / 国内",
  "Other / 其他",
];

const PROVIDER_GROUP_LABELS: Record<string, string> = {
  "International / 国际": "国际",
  "Domestic / 国内": "国内",
  "Other / 其他": "其他",
};

export function AISettings() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const settings = useSettingsStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalType, setConfigModalType] = useState<"chat" | "image">("chat");
  const [configModalMode, setConfigModalMode] = useState<"add" | "edit">("add");

  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<AITestResult | null>(null);

  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "openai",
    apiKey: "",
    apiUrl: "",
    model: "",
  });
  const [chatParams, setChatParams] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    topK: undefined as number | undefined,
    frequencyPenalty: 0,
    presencePenalty: 0,
    stream: false,
    enableThinking: false,
    customParams: {} as Record<string, string | number | boolean>,
  });
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);

  const [fetchingModels, setFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const [fetchingImageModels, setFetchingImageModels] = useState(false);
  const [availableImageModels, setAvailableImageModels] = useState<ModelInfo[]>([]);
  const [showImageModelPicker, setShowImageModelPicker] = useState(false);
  const [imageModelSearchQuery, setImageModelSearchQuery] = useState("");
  const [collapsedImageCategories, setCollapsedImageCategories] = useState<Set<string>>(new Set());

  const [imageTestModalResult, setImageTestModalResult] = useState<ImageTestResult | null>(null);

  const [streamingContent, setStreamingContent] = useState("");
  const [streamingThinking, setStreamingThinking] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const chatModels = useMemo(
    () => settings.aiModels.filter((m) => m.type === "chat" || !m.type),
    [settings.aiModels],
  );
  const imageModels = useMemo(
    () => settings.aiModels.filter((m) => m.type === "image"),
    [settings.aiModels],
  );

  const filteredModels = useMemo(
    () =>
      availableModels.filter(
        (m) =>
          m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
          m.owned_by?.toLowerCase().includes(modelSearchQuery.toLowerCase()),
      ),
    [availableModels, modelSearchQuery],
  );

  const filteredImageModels = useMemo(
    () =>
      availableImageModels.filter(
        (m) =>
          m.id.toLowerCase().includes(imageModelSearchQuery.toLowerCase()) ||
          m.owned_by?.toLowerCase().includes(imageModelSearchQuery.toLowerCase()),
      ),
    [availableImageModels, imageModelSearchQuery],
  );

  const getModelCategory = (model: any): string => {
    const id = (model.model || model.id || "").toLowerCase();
    const owner = model.owned_by?.toLowerCase() || "";

    for (const item of MODEL_CATEGORY_CONFIG) {
      if (item.ownerKeywords && item.ownerKeywords.some((k) => owner.includes(k))) {
        return item.category;
      }
    }

    for (const item of MODEL_CATEGORY_CONFIG) {
      if (item.idKeywords && item.idKeywords.some((k) => id.includes(k))) {
        return item.category;
      }
    }

    if (id.includes("embedding") || id.includes("text-embedding")) return "Embedding";
    if (id.includes("whisper") || id.includes("tts")) return "Audio";
    if (id.includes("dall-e") || id.includes("stable-diffusion")) return "Image";

    return "Other";
  };

  const { categorizedModels, sortedCategories } = useMemo(() => {
    const categorized = filteredModels.reduce(
      (acc, model) => {
        const category = getModelCategory(model);
        if (!acc[category]) acc[category] = [];
        acc[category].push(model);
        return acc;
      },
      {} as Record<string, ModelInfo[]>,
    );

    const sorted = Object.keys(categorized).sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return { categorizedModels: categorized, sortedCategories: sorted };
  }, [filteredModels]);

  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const toggleImageCategory = useCallback((category: string) => {
    setCollapsedImageCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const { categorizedImageModels, sortedImageCategories } = useMemo(() => {
    const categorized = filteredImageModels.reduce(
      (acc, model) => {
        let category = getModelCategory(model);
        if (category === "Gemini") {
          category = "nanobananai 🍌";
        }
        if (!acc[category]) acc[category] = [];
        acc[category].push(model);
        return acc;
      },
      {} as Record<string, ModelInfo[]>,
    );

    const sorted = Object.keys(categorized).sort((a, b) => {
      const indexA = IMAGE_CATEGORY_ORDER.indexOf(a);
      const indexB = IMAGE_CATEGORY_ORDER.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return {
      categorizedImageModels: categorized,
      sortedImageCategories: sorted,
    };
  }, [filteredImageModels]);

  const modalPreviewEndpoint = useMemo(() => {
    if (!newModel.apiUrl) return "";
    if (configModalType === "chat") {
      return getApiEndpointPreview(newModel.apiUrl);
    }
    return getImageApiEndpointPreview(newModel.apiUrl);
  }, [newModel.apiUrl, configModalType]);

  const getProviderName = useCallback((providerId: string) => {
    const p = ALL_PROVIDERS.find((p) => p.id === providerId);
    return p?.name ?? providerId;
  }, []);

  const handleTestModel = async (model: (typeof settings.aiModels)[0]) => {
    setTestingModelId(model.id);
    setAiTestResult(null);
    setStreamingContent("");
    setStreamingThinking("");

    const useStream = model.chatParams?.stream ?? false;

    if (useStream) {
      setIsStreaming(true);
    }

    const result = await testAIConnection(
      {
        provider: model.provider,
        apiKey: model.apiKey,
        apiUrl: model.apiUrl,
        model: model.model,
        chatParams: model.chatParams,
      },
      undefined,
      useStream
        ? {
            onContent: (chunk) => setStreamingContent((prev) => prev + chunk),
            onThinking: (chunk) => setStreamingThinking((prev) => prev + chunk),
          }
        : undefined,
    );

    setIsStreaming(false);
    setAiTestResult(result);
    setTestingModelId(null);

    if (result.success) {
      const thinkingInfo = result.thinkingContent ? " (含思考过程)" : "";
      showToast(`连接成功 (${result.latency}ms)${thinkingInfo}`, "success");
    } else {
      showToast(result.error || "连接失败", "error");
    }
  };

  const handleTestImageModel = async (model: (typeof settings.aiModels)[0]) => {
    setTestingModelId(model.id);

    const result = await testImageGeneration(
      {
        provider: model.provider,
        apiKey: model.apiKey,
        apiUrl: model.apiUrl,
        model: model.model,
      },
      "A cute cat sitting on a windowsill",
    );

    setTestingModelId(null);
    setImageTestModalResult(result);
  };

  const handleFetchModelsInModal = async () => {
    if (!newModel.apiKey || !newModel.apiUrl) {
      showToast(t("settings.fillApiFirst"), "error");
      return;
    }

    setFetchingModels(true);
    setAvailableModels([]);
    setModelSearchQuery("");

    const result = await fetchAvailableModels(newModel.apiUrl, newModel.apiKey);

    setFetchingModels(false);

    if (result.success && result.models.length > 0) {
      setAvailableModels(result.models);
      setShowModelPicker(true);
      showToast(t("settings.modelsLoaded", { count: result.models.length }), "success");
    } else {
      showToast(result.error || t("settings.noModelsFound"), "error");
    }
  };

  const handleFetchImageModelsInModal = async () => {
    if (!newModel.apiKey || !newModel.apiUrl) {
      showToast(t("settings.fillApiFirst"), "error");
      return;
    }

    setFetchingImageModels(true);
    setAvailableImageModels([]);
    setImageModelSearchQuery("");

    const result = await fetchAvailableModels(newModel.apiUrl, newModel.apiKey);

    setFetchingImageModels(false);

    if (result.success && result.models.length > 0) {
      setAvailableImageModels(result.models);
      setShowImageModelPicker(true);
      showToast(t("settings.modelsLoaded", { count: result.models.length }), "success");
    } else {
      showToast(result.error || t("settings.noModelsFound"), "error");
    }
  };

  const handlePickerAddModel = (modelId: string) => {
    if (!newModel.apiKey || !newModel.apiUrl) {
      showToast(t("settings.fillApiFirst"), "error");
      return;
    }

    settings.addAiModel({
      name: modelId,
      provider: newModel.provider,
      apiKey: newModel.apiKey,
      apiUrl: newModel.apiUrl,
      model: modelId,
      type: "chat",
    });
    showToast(t("settings.modelAdded"), "success");
  };

  const handlePickerAddImageModel = (modelId: string) => {
    if (!newModel.apiKey || !newModel.apiUrl) {
      showToast(t("settings.fillApiFirst"), "error");
      return;
    }

    settings.addAiModel({
      name: modelId,
      provider: newModel.provider,
      apiKey: newModel.apiKey,
      apiUrl: newModel.apiUrl,
      model: modelId,
      type: "image",
    });
    showToast(t("settings.modelAdded"), "success");
  };

  const handleTestProviderApiKey = async () => {
    if (!newModel.apiKey || !newModel.apiUrl) {
      showToast(t("settings.fillApiFirst"), "error");
      return;
    }

    setAiTesting(true);
    setAiTestResult(null);

    const result = await fetchAvailableModels(newModel.apiUrl, newModel.apiKey);

    setAiTesting(false);

    if (result.success) {
      showToast(`API 密钥验证成功，发现 ${result.models.length} 个模型`, "success");
    } else {
      showToast(result.error || "API 密钥验证失败", "error");
    }
  };

  const openAddModal = (type: "chat" | "image") => {
    const providers = type === "chat" ? AI_PROVIDERS : AI_IMAGE_PROVIDERS;
    const defaultProvider = providers[0];
    setConfigModalType(type);
    setConfigModalMode("add");
    setEditingModelId(null);
    setNewModel({
      name: "",
      provider: defaultProvider.id,
      apiKey: "",
      apiUrl: defaultProvider.defaultUrl,
      model: defaultProvider.models?.[0] || "",
    });
    setChatParams({
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      topK: undefined,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stream: false,
      enableThinking: false,
      customParams: {},
    });
    setShowAdvancedParams(false);
    setShowConfigModal(true);
  };

  const openEditModal = (model: (typeof settings.aiModels)[0], type: "chat" | "image") => {
    setConfigModalType(type);
    setConfigModalMode("edit");
    setEditingModelId(model.id);
    setNewModel({
      name: model.name || "",
      provider: model.provider,
      apiKey: model.apiKey,
      apiUrl: model.apiUrl,
      model: model.model,
    });
    if (type === "chat" && model.chatParams) {
      setChatParams({
        temperature: model.chatParams.temperature ?? 0.7,
        maxTokens: model.chatParams.maxTokens ?? 2048,
        topP: model.chatParams.topP ?? 1.0,
        topK: model.chatParams.topK,
        frequencyPenalty: model.chatParams.frequencyPenalty ?? 0,
        presencePenalty: model.chatParams.presencePenalty ?? 0,
        stream: model.chatParams.stream ?? false,
        enableThinking: model.chatParams.enableThinking ?? false,
        customParams: model.chatParams.customParams ?? {},
      });
    } else {
      setChatParams({
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1.0,
        topK: undefined,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stream: false,
        enableThinking: false,
        customParams: {},
      });
    }
    setShowAdvancedParams(false);
    setShowConfigModal(true);
  };

  const handleModalProviderChange = (providerId: string) => {
    const providers = configModalType === "chat" ? AI_PROVIDERS : AI_IMAGE_PROVIDERS;
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) {
      const fallback = ALL_PROVIDERS.find((p) => p.id === providerId);
      setNewModel({
        ...newModel,
        provider: providerId,
        apiUrl: fallback?.defaultUrl || "",
        model: "",
      });
      return;
    }
    setNewModel({
      ...newModel,
      provider: providerId,
      apiUrl: provider.defaultUrl,
      model: provider.models?.[0] || "",
    });
  };

  const handleSaveModal = () => {
    if (!newModel.apiKey || !newModel.apiUrl || !newModel.model) {
      showToast(t("settings.fillComplete"), "error");
      return;
    }

    if (configModalType === "chat") {
      const modelConfig = {
        name: newModel.name,
        provider: newModel.provider,
        apiKey: newModel.apiKey,
        apiUrl: newModel.apiUrl,
        model: newModel.model,
        type: "chat" as const,
        chatParams: {
          temperature: chatParams.temperature,
          maxTokens: chatParams.maxTokens,
          topP: chatParams.topP,
          frequencyPenalty: chatParams.frequencyPenalty,
          presencePenalty: chatParams.presencePenalty,
          stream: chatParams.stream,
          enableThinking: chatParams.enableThinking,
          customParams: chatParams.customParams,
        },
      };
      if (configModalMode === "edit" && editingModelId) {
        settings.updateAiModel(editingModelId, modelConfig);
        showToast(t("settings.modelUpdated"), "success");
      } else {
        settings.addAiModel(modelConfig);
        showToast(t("settings.modelAdded"), "success");
      }
    } else {
      const modelConfig = {
        name: newModel.name,
        provider: newModel.provider,
        apiKey: newModel.apiKey,
        apiUrl: newModel.apiUrl,
        model: newModel.model,
        type: "image" as const,
      };
      if (configModalMode === "edit" && editingModelId) {
        settings.updateAiModel(editingModelId, modelConfig);
        showToast(t("settings.modelUpdated"), "success");
      } else {
        settings.addAiModel(modelConfig);
        showToast(t("settings.modelAdded"), "success");
      }
    }

    setShowConfigModal(false);
    setEditingModelId(null);
  };

  const getModalProviders = () => {
    const providers = configModalType === "chat" ? AI_PROVIDERS : AI_IMAGE_PROVIDERS;
    const grouped: Record<string, typeof providers> = {};
    for (const p of providers) {
      if (!grouped[p.group]) grouped[p.group] = [];
      grouped[p.group].push(p);
    }
    return grouped;
  };

  const getModalBuiltinModels = () => {
    const providers = configModalType === "chat" ? AI_PROVIDERS : AI_IMAGE_PROVIDERS;
    const provider = providers.find((p) => p.id === newModel.provider);
    return provider?.models ?? [];
  };

  return (
    <div className="space-y-6">
      <SettingSection title="对话模型">
        <div className="p-2">
          {chatModels.length > 0 ? (
            <div className="space-y-0.5">
              {chatModels.map((model) => {
                const providerName = getProviderName(model.provider);
                const category = PROVIDER_ID_TO_CATEGORY[model.provider] || "Other";
                return (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:bg-muted/40 group ${model.isDefault ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex-shrink-0">{getCategoryIcon(category, 20)}</div>
                      <span className="text-sm text-muted-foreground flex-shrink-0">{providerName}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-sm font-medium truncate">{model.name || model.model}</span>
                      {model.name && model.name !== model.model && (
                        <span className="text-xs text-muted-foreground truncate">({model.model})</span>
                      )}
                      {model.isDefault && (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                          <StarIcon className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          默认
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTestModel(model)}
                        disabled={testingModelId === model.id}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        title="测试连接"
                      >
                        {testingModelId === model.id ? (
                          <Loader2Icon className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <PlayIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                      {!model.isDefault && (
                        <button
                          onClick={() => settings.setDefaultAiModel(model.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          title="设为默认"
                        >
                          <StarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(model, "chat")}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="编辑"
                      >
                        <EditIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("确定要删除这个模型配置吗？")) {
                            settings.deleteAiModel(model.id);
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="删除"
                      >
                        <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border/60 rounded-lg cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              onClick={() => openAddModal("chat")}
            >
              <PlusIcon className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <span className="text-sm font-medium text-muted-foreground">添加对话模型</span>
              <span className="text-xs text-muted-foreground/60 mt-1">配置 API 密钥和模型开始使用</span>
            </div>
          )}
          {chatModels.length > 0 && (
            <div className="mt-2 flex justify-end px-1">
              <button
                onClick={() => openAddModal("chat")}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                添加
              </button>
            </div>
          )}
        </div>
      </SettingSection>

      <SettingSection title="生图模型">
        <div className="p-2">
          {imageModels.length > 0 ? (
            <div className="space-y-0.5">
              {imageModels.map((model) => {
                const providerName = getProviderName(model.provider);
                const category = PROVIDER_ID_TO_CATEGORY[model.provider] || "Other";
                return (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:bg-muted/40 group ${model.isDefault ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex-shrink-0">{getCategoryIcon(category, 20)}</div>
                      <span className="text-sm text-muted-foreground flex-shrink-0">{providerName}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-sm font-medium truncate">{model.name || model.model}</span>
                      {model.name && model.name !== model.model && (
                        <span className="text-xs text-muted-foreground truncate">({model.model})</span>
                      )}
                      {model.isDefault && (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                          <StarIcon className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          默认
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTestImageModel(model)}
                        disabled={testingModelId === model.id}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        title="测试生图"
                      >
                        {testingModelId === model.id ? (
                          <Loader2Icon className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <PlayIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                      {!model.isDefault && (
                        <button
                          onClick={() => settings.setDefaultAiModel(model.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          title="设为默认"
                        >
                          <StarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(model, "image")}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="编辑"
                      >
                        <EditIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("确定要删除这个模型配置吗？")) {
                            settings.deleteAiModel(model.id);
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="删除"
                      >
                        <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border/60 rounded-lg cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              onClick={() => openAddModal("image")}
            >
              <PlusIcon className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <span className="text-sm font-medium text-muted-foreground">添加生图模型</span>
              <span className="text-xs text-muted-foreground/60 mt-1">配置图像生成 API 开始使用</span>
            </div>
          )}
          {imageModels.length > 0 && (
            <div className="mt-2 flex justify-end px-1">
              <button
                onClick={() => openAddModal("image")}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                添加
              </button>
            </div>
          )}
        </div>
      </SettingSection>

      <SettingSection title="说明">
        <div className="p-4 space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/60 mt-0.5">·</span>
            <span>配置 AI 模型后可以在 Prompt 详情页测试效果</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/60 mt-0.5">·</span>
            <span>API Key 安全存储在本地，不会上传到任何服务器</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/60 mt-0.5">·</span>
            <span>支持 OpenAI 兼容格式的 API（大部分服务商兼容）</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/60 mt-0.5">·</span>
            <span>模型名称可以手动输入，不限于预设列表</span>
          </div>
        </div>
      </SettingSection>

      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl w-[520px] max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {configModalMode === "add"
                  ? configModalType === "chat" ? "添加对话模型" : "添加生图模型"
                  : configModalType === "chat" ? "编辑对话模型" : "编辑生图模型"}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">服务商</label>
                <select
                  value={newModel.provider}
                  onChange={(e) => handleModalProviderChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-1 focus:ring-primary/30 transition-shadow"
                >
                  {PROVIDER_GROUP_ORDER.map((groupKey) => {
                    const grouped = getModalProviders();
                    const providers = grouped[groupKey];
                    if (!providers || providers.length === 0) return null;
                    return (
                      <optgroup key={groupKey} label={PROVIDER_GROUP_LABELS[groupKey] || groupKey}>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">API 密钥</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PasswordInput
                      placeholder={t("settings.apiKeyPlaceholder")}
                      value={newModel.apiKey}
                      onChange={(v) => setNewModel({ ...newModel, apiKey: v })}
                      className="h-9"
                    />
                  </div>
                  <button
                    onClick={handleTestProviderApiKey}
                    disabled={aiTesting || !newModel.apiKey || !newModel.apiUrl}
                    className="h-9 px-4 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                  >
                    {aiTesting ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : null}
                    检测
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center justify-between">
                  <span>API 地址</span>
                  <span className="text-[10px] opacity-60 font-normal">{t("settings.apiUrlHint")}</span>
                </label>
                <input
                  type="text"
                  placeholder={t("settings.apiUrlPlaceholder")}
                  value={newModel.apiUrl}
                  onChange={(e) => setNewModel({ ...newModel, apiUrl: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-1 focus:ring-primary/30 transition-shadow"
                />
                {newModel.apiUrl && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    <span className="text-muted-foreground/70">预览：</span>
                    <span className="font-mono text-primary break-all">{modalPreviewEndpoint}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">模型</label>
                  <button
                    type="button"
                    onClick={configModalType === "chat" ? handleFetchModelsInModal : handleFetchImageModelsInModal}
                    disabled={(configModalType === "chat" ? fetchingModels : fetchingImageModels) || !newModel.apiKey || !newModel.apiUrl}
                    className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                  >
                    {(configModalType === "chat" ? fetchingModels : fetchingImageModels) ? (
                      <Loader2Icon className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCwIcon className="w-3 h-3" />
                    )}
                    {t("settings.fetchModels")}
                  </button>
                </div>
                {(() => {
                  const builtinModels = getModalBuiltinModels();
                  if (builtinModels.length > 0) {
                    return (
                      <div className="space-y-2">
                        <select
                          value={builtinModels.includes(newModel.model) ? newModel.model : "__custom__"}
                          onChange={(e) => {
                            if (e.target.value !== "__custom__") {
                              setNewModel({ ...newModel, model: e.target.value });
                            } else {
                              setNewModel({ ...newModel, model: "" });
                            }
                          }}
                          className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-1 focus:ring-primary/30 transition-shadow"
                        >
                          {builtinModels.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          <option value="__custom__">{t("settings.customModel", "自定义模型...")}</option>
                        </select>
                        {!builtinModels.includes(newModel.model) && (
                          <input
                            type="text"
                            placeholder={t("settings.modelNamePlaceholder")}
                            value={newModel.model}
                            onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-1 focus:ring-primary/30 transition-shadow"
                          />
                        )}
                      </div>
                    );
                  }
                  return (
                    <input
                      type="text"
                      placeholder={t("settings.modelNamePlaceholder")}
                      value={newModel.model}
                      onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-1 focus:ring-primary/30 transition-shadow"
                    />
                  );
                })()}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("settings.customNameOptional")}
                </label>
                <input
                  type="text"
                  placeholder={t("settings.customNamePlaceholder")}
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-1 focus:ring-primary/30 transition-shadow"
                />
              </div>

              {configModalType === "chat" && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">{t("settings.advancedParams")}</span>
                    {showAdvancedParams ? (
                      <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {showAdvancedParams && (
                    <div className="p-3 space-y-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">{t("settings.streamOutput")}</label>
                          <p className="text-xs text-muted-foreground">{t("settings.streamOutputDesc")}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setChatParams({ ...chatParams, stream: !chatParams.stream })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${chatParams.stream ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${chatParams.stream ? "translate-x-5" : ""}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">{t("settings.enableThinking")}</label>
                          <p className="text-xs text-muted-foreground">{t("settings.enableThinkingDesc")}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setChatParams({ ...chatParams, enableThinking: !chatParams.enableThinking })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${chatParams.enableThinking ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${chatParams.enableThinking ? "translate-x-5" : ""}`} />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium">{t("settings.temperature")}</label>
                          <span className="text-xs text-muted-foreground font-mono">{chatParams.temperature.toFixed(1)}</span>
                        </div>
                        <input type="range" min="0" max="2" step="0.1" value={chatParams.temperature} onChange={(e) => setChatParams({ ...chatParams, temperature: parseFloat(e.target.value) })} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                        <p className="text-xs text-muted-foreground mt-1">{t("settings.temperatureDesc")}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium">{t("settings.maxTokens")}</label>
                          <span className="text-xs text-muted-foreground font-mono">{chatParams.maxTokens}</span>
                        </div>
                        <input type="range" min="256" max="32768" step="256" value={chatParams.maxTokens} onChange={(e) => setChatParams({ ...chatParams, maxTokens: parseInt(e.target.value) })} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                        <p className="text-xs text-muted-foreground mt-1">{t("settings.maxTokensDesc")}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium">{t("settings.topP")}</label>
                          <span className="text-xs text-muted-foreground font-mono">{chatParams.topP.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={chatParams.topP} onChange={(e) => setChatParams({ ...chatParams, topP: parseFloat(e.target.value) })} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                        <p className="text-xs text-muted-foreground mt-1">{t("settings.topPDesc")}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium">{t("settings.frequencyPenalty")}</label>
                          <span className="text-xs text-muted-foreground font-mono">{chatParams.frequencyPenalty.toFixed(1)}</span>
                        </div>
                        <input type="range" min="-2" max="2" step="0.1" value={chatParams.frequencyPenalty} onChange={(e) => setChatParams({ ...chatParams, frequencyPenalty: parseFloat(e.target.value) })} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                        <p className="text-xs text-muted-foreground mt-1">{t("settings.frequencyPenaltyDesc")}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium">{t("settings.presencePenalty")}</label>
                          <span className="text-xs text-muted-foreground font-mono">{chatParams.presencePenalty.toFixed(1)}</span>
                        </div>
                        <input type="range" min="-2" max="2" step="0.1" value={chatParams.presencePenalty} onChange={(e) => setChatParams({ ...chatParams, presencePenalty: parseFloat(e.target.value) })} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                        <p className="text-xs text-muted-foreground mt-1">{t("settings.presencePenaltyDesc")}</p>
                      </div>

                      <div className="border-t border-border pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium">{t("settings.customParams", "自定义参数")}</label>
                          <button
                            type="button"
                            onClick={() => {
                              const newKey = `param_${Date.now()}`;
                              setChatParams({ ...chatParams, customParams: { ...chatParams.customParams, [newKey]: "" } });
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            + {t("settings.addCustomParam", "添加参数")}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {t("settings.customParamsDesc", "添加自定义请求参数，如 max_completion_tokens 等")}
                        </p>
                        <div className="space-y-2">
                          {Object.entries(chatParams.customParams).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={t("settings.paramName", "参数名")}
                                defaultValue={key.startsWith("param_") ? "" : key}
                                onBlur={(e) => {
                                  const newKey = e.target.value.trim();
                                  if (newKey && newKey !== key) {
                                    const { [key]: oldValue, ...rest } = chatParams.customParams;
                                    setChatParams({ ...chatParams, customParams: { ...rest, [newKey]: oldValue } });
                                  }
                                }}
                                className="flex-1 h-8 px-3 rounded-lg bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <input
                                type="text"
                                placeholder={t("settings.paramValue", "参数值")}
                                value={String(value)}
                                onChange={(e) => {
                                  let parsedValue: string | number | boolean = e.target.value;
                                  if (e.target.value === "true") parsedValue = true;
                                  else if (e.target.value === "false") parsedValue = false;
                                  else if (!isNaN(Number(e.target.value)) && e.target.value !== "") {
                                    parsedValue = Number(e.target.value);
                                  }
                                  setChatParams({ ...chatParams, customParams: { ...chatParams.customParams, [key]: parsedValue } });
                                }}
                                className="flex-1 h-8 px-3 rounded-lg bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const { [key]: _, ...rest } = chatParams.customParams;
                                  setChatParams({ ...chatParams, customParams: rest });
                                }}
                                className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                                title={t("common.delete")}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 pt-4 border-t border-border">
              <button
                onClick={() => setShowConfigModal(false)}
                className="h-9 px-5 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSaveModal}
                className="h-9 px-5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {configModalMode === "edit" ? t("settings.saveChanges") : t("settings.addModel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModelPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">{t("settings.selectModels")}</h3>
              <button onClick={() => setShowModelPicker(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("settings.searchModels")}
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("settings.totalModels", { count: availableModels.length })}
                {modelSearchQuery && ` • ${t("settings.filteredModels", { count: filteredModels.length })}`}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("settings.noModelsMatch")}</div>
              ) : (
                <div className="space-y-2">
                  {sortedCategories.map((category) => {
                    const models = categorizedModels[category];
                    const isCollapsed = collapsedCategories.has(category);
                    const addedCount = models.filter((m) =>
                      settings.aiModels.some((am) => am.model === m.id && am.provider === newModel.provider),
                    ).length;

                    return (
                      <div key={category} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
                            <span className="flex-shrink-0">{getCategoryIcon(category, 18)}</span>
                            <span className="font-medium text-sm">{category}</span>
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">{models.length}</span>
                            {addedCount > 0 && (
                              <span className="text-xs text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                                {t("settings.addedCount", { count: addedCount })}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              models.forEach((m) => {
                                const isAdded = settings.aiModels.some((am) => am.model === m.id && am.provider === newModel.provider);
                                if (!isAdded) handlePickerAddModel(m.id);
                              });
                            }}
                            className="text-xs text-primary hover:underline px-2 py-1"
                          >
                            {t("settings.addAll")}
                          </button>
                        </button>

                        {!isCollapsed && (
                          <div className="divide-y divide-border">
                            {models.map((model) => {
                              const isAdded = settings.aiModels.some((m) => m.model === model.id && m.provider === newModel.provider);
                              return (
                                <div
                                  key={model.id}
                                  className={`flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors ${isAdded ? "bg-primary/5" : ""}`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0">{getCategoryIcon(category, 18)}</div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">{model.id}</div>
                                      {model.owned_by && <div className="text-xs text-muted-foreground">{model.owned_by}</div>}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handlePickerAddModel(model.id)}
                                    disabled={isAdded}
                                    className={`ml-3 p-1.5 rounded-lg transition-colors ${
                                      isAdded ? "bg-primary/20 text-primary cursor-default" : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                                    }`}
                                    title={isAdded ? t("settings.modelAlreadyAdded") : t("settings.addModel")}
                                  >
                                    {isAdded ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setShowModelPicker(false)} className="w-full h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                {t("common.done")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModelPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">{t("settings.selectImageModels", "选择生图模型")}</h3>
              <button onClick={() => setShowImageModelPicker(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("settings.searchModels")}
                  value={imageModelSearchQuery}
                  onChange={(e) => setImageModelSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("settings.totalModels", { count: availableImageModels.length })}
                {imageModelSearchQuery && ` • ${t("settings.filteredModels", { count: filteredImageModels.length })}`}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredImageModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("settings.noModelsMatch")}</div>
              ) : (
                <div className="space-y-2">
                  {sortedImageCategories.map((category) => {
                    const models = categorizedImageModels[category];
                    const isCollapsed = collapsedImageCategories.has(category);
                    const addedCount = models.filter((m) =>
                      settings.aiModels.some((am) => am.model === m.id && am.provider === newModel.provider && am.type === "image"),
                    ).length;

                    return (
                      <div key={category} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleImageCategory(category)}
                          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
                            <span className="flex-shrink-0">{getCategoryIcon(category, 18)}</span>
                            <span className="font-medium text-sm">{category}</span>
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">{models.length}</span>
                            {addedCount > 0 && (
                              <span className="text-xs text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                                {t("settings.addedCount", { count: addedCount })}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              models.forEach((m) => {
                                const isAdded = settings.aiModels.some((am) => am.model === m.id && am.provider === newModel.provider && am.type === "image");
                                if (!isAdded) handlePickerAddImageModel(m.id);
                              });
                            }}
                            className="text-xs text-primary hover:underline px-2 py-1"
                          >
                            {t("settings.addAll")}
                          </button>
                        </button>

                        {!isCollapsed && (
                          <div className="divide-y divide-border">
                            {models.map((model) => {
                              const isAdded = settings.aiModels.some((m) => m.model === model.id && m.provider === newModel.provider && m.type === "image");
                              return (
                                <div
                                  key={model.id}
                                  className={`flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors ${isAdded ? "bg-primary/5" : ""}`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0">{getCategoryIcon(category, 18)}</div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">{model.id}</div>
                                      {model.owned_by && <div className="text-xs text-muted-foreground">{model.owned_by}</div>}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handlePickerAddImageModel(model.id)}
                                    disabled={isAdded}
                                    className={`ml-3 p-1.5 rounded-lg transition-colors ${
                                      isAdded ? "bg-primary/20 text-primary cursor-default" : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                                    }`}
                                    title={isAdded ? t("settings.modelAlreadyAdded") : t("settings.addModel")}
                                  >
                                    {isAdded ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setShowImageModelPicker(false)} className="w-full h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                {t("common.done")}
              </button>
            </div>
          </div>
        </div>
      )}

      {imageTestModalResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl w-[500px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {imageTestModalResult.success
                  ? t("settings.imageTestSuccess", "生图测试成功")
                  : t("settings.imageTestFailed", "生图测试失败")}
              </h3>
              <button onClick={() => setImageTestModalResult(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {imageTestModalResult.success ? (
                <div className="space-y-4">
                  {imageTestModalResult.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img src={imageTestModalResult.imageUrl} alt="Generated" className="w-full h-auto" />
                    </div>
                  )}
                  {imageTestModalResult.imageBase64 && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img src={`data:image/png;base64,${imageTestModalResult.imageBase64}`} alt="Generated" className="w-full h-auto" />
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("settings.model", "模型")}</span>
                      <span className="font-medium">{imageTestModalResult.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("settings.latency", "耗时")}</span>
                      <span className="font-medium">{imageTestModalResult.latency}ms</span>
                    </div>
                    {imageTestModalResult.revisedPrompt && (
                      <div>
                        <span className="text-muted-foreground block mb-1">{t("settings.revisedPrompt", "修正后的提示词")}</span>
                        <p className="text-xs bg-muted p-2 rounded">{imageTestModalResult.revisedPrompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-sm text-destructive">{imageTestModalResult.error}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("settings.model", "模型")}</span>
                      <span className="font-medium">{imageTestModalResult.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("settings.latency", "耗时")}</span>
                      <span className="font-medium">{imageTestModalResult.latency}ms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setImageTestModalResult(null)} className="w-full h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                {t("common.close", "关闭")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
