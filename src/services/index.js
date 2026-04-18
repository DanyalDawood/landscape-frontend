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

// Helper to convert File/Blob to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:image/png;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const generateOutputDesigns = async ({ style_id, ai_creativity, number_of_designs, ai_instruction, preset_id, output_id, input_image1, mask }) => {

  // Convert images to base64
  const mask_b64 = await fileToBase64(mask);
  let input_image_b64 = "";
  if (input_image1) {
    input_image_b64 = await fileToBase64(input_image1);
  }

  // Truncate instruction
  const instruction = ai_instruction ? ai_instruction.substring(0, 200) : "";

  // Send as JSON body
  const body = {
    style_id: parseInt(style_id),
    ai_creativity: parseFloat(ai_creativity),
    number_of_designs: parseInt(number_of_designs),
    ai_instruction: instruction,
    preset_id: preset_id ? parseInt(preset_id) : 0,
    input_image_b64: input_image_b64,
    mask_b64: mask_b64
  };

  // 10 minute timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
    const response = await fetch(`${BASE_URL}/Generate_Output_Designs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
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