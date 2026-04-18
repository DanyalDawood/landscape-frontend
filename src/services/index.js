import queryString from "query-string";

const BASE_URL = 'https://danyal178-landscape-backend.hf.space'

export const getDesignStyles = async () => {
  const response = await fetch(`${BASE_URL}/Get_Design_Styles`);
  if (!response.ok) {
    throw new Error('Something went wrong')
  }
  const data = await response.json();
  return data;
}

export const saveOutputImage = async (output_id) => {
  const params = queryString.stringify(output_id);
  const response = await fetch(`${BASE_URL}/Save_Output_Image?${params}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error('Something went wrong')
  }
  const data = await response.json();
  return data;
}

export const getSavedImages = async () => {
  const response = await fetch(`${BASE_URL}/Get_Saved_Images`);
  if (!response.ok) {
    throw new Error('Something went wrong while fetching the saved images. Please try again later')
  }
  const data = await response.json();
  return data;
};

export const deleteSavedImages = async (payload) => {
  const params = queryString.stringify(payload);
  const response = await fetch(`${BASE_URL}/Delete_Saved_Image?${params}`, {
    method: "POST",
  });
  const data = await response.json();
  return data;
};

export const saveAlgorithmFeedback = async (payload) => {
  const params = queryString.stringify(payload);
  const response = await fetch(`${BASE_URL}/Save_Algorithm_Feedback?${params}`, {
    method: "PUT",
  });
  const data = await response.json();
  return data;
};

export const getPresetImages = async () => {
  const response = await fetch(`${BASE_URL}/Get_Preset_Input_Images`)
  if (!response.ok) {
    throw new Error("Failed to fetch preset images");
  }
  const data = await response.json();
  return data?.preset_images || [];
};

export const generateOutputDesigns = async ({ style_id, ai_creativity, number_of_designs, ai_instruction, preset_id, output_id, input_image1, mask }) => {

  // Build URL without ai_instruction to avoid URL length issues
  let url = `${BASE_URL}/Generate_Output_Designs?style_id=${style_id}&ai_creativity=${ai_creativity}&number_of_designs=${number_of_designs}`;

  if (preset_id) {
    url += `&preset_id=${preset_id}`;
  }
  if (output_id) {
    url += `&output_id=${output_id}`;
  }

  // Truncate ai_instruction to avoid URL length limit
  const instruction = ai_instruction ? ai_instruction.substring(0, 200) : "";
  url += `&ai_instruction=${encodeURIComponent(instruction)}`;

  const formData = new FormData();
  if (input_image1) {
    formData.append("input_image1", input_image1);
  }
  formData.append("mask", mask);

  // 10 minute timeout for slow generation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Something went wrong');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Generation timed out. Please try again with fewer designs.');
    }
    throw error;
  }
};