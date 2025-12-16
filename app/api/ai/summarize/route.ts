import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime for external API calls
export const runtime = "nodejs";

// Hugging Face API configuration
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

// Use a multilingual model that supports Khmer
// Options: 'facebook/mbart-large-50-many-to-many-mmt' or 'google/flan-t5-large' or 'mistralai/Mistral-7B-Instruct-v0.2'
// Use a multilingual model that supports Khmer
// Options:
// - 'mistralai/Mistral-7B-Instruct-v0.2' (best quality, requires API key)
// - 'google/flan-t5-large' (good balance)
// - 'facebook/mbart-large-50-many-to-many-mmt' (multilingual)
// For free tier, use smaller models like 'google/flan-t5-base'
const MODEL_NAME = process.env.HUGGINGFACE_MODEL || "google/flan-t5-large";

interface Listing {
  type: string;
  status: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface SummaryRequest {
  listings: Listing[];
  userLocation?: { lat: number; lng: number } | null;
  selectedCity?: string | null;
}

// Generate structured data summary
function generateDataSummary(
  listings: Listing[],
  selectedCity?: string | null
) {
  // Count by type and status
  const counts: Record<
    string,
    { open: number; limited: number; total: number }
  > = {
    accommodation: { open: 0, limited: 0, total: 0 },
    fuel_service: { open: 0, limited: 0, total: 0 },
    car_transportation: { open: 0, limited: 0, total: 0 },
    volunteer_request: { open: 0, limited: 0, total: 0 },
    event: { open: 0, limited: 0, total: 0 },
    site_sponsor: { open: 0, limited: 0, total: 0 },
  };

  // Group by location
  const locationGroups: Record<
    string,
    {
      accommodation: number;
      fuel_service: number;
      car_transportation: number;
      volunteer_request: number;
      total: number;
    }
  > = {};

  listings.forEach((listing) => {
    const type = listing.type;
    if (type in counts) {
      if (listing.status === "open") counts[type].open++;
      if (listing.status === "limited") counts[type].limited++;
      counts[type].total = counts[type].open + counts[type].limited;
    }

    // Group by area
    const area = listing.area || "Unknown";
    if (!locationGroups[area]) {
      locationGroups[area] = {
        accommodation: 0,
        fuel_service: 0,
        car_transportation: 0,
        volunteer_request: 0,
        total: 0,
      };
    }
    if (type in locationGroups[area]) {
      locationGroups[area][type as keyof (typeof locationGroups)[string]]++;
      locationGroups[area].total++;
    }
  });

  return { counts, locationGroups };
}

// Call Hugging Face API
async function callHuggingFace(prompt: string): Promise<string> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error("Hugging Face API key not configured");
  }

  try {
    const response = await fetch(`${HUGGINGFACE_API_URL}/${MODEL_NAME}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      // Handle rate limiting or model loading
      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes("loading")) {
          // Model is loading, wait and retry once
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return callHuggingFace(prompt);
        }
      }
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.trim();
    }
    if (data.generated_text) {
      return data.generated_text.trim();
    }
    if (typeof data === "string") {
      return data.trim();
    }
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
      return data[0].trim();
    }

    return JSON.stringify(data);
  } catch (error: any) {
    console.error("Hugging Face API error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();
    const { listings, userLocation, selectedCity } = body;

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        summary: "មិនមានជំនួយនៅក្នុងតំបន់នេះនៅពេលនេះទេ។",
        suggestions: [],
        stats: {},
      });
    }

    // Generate structured summary
    const { counts, locationGroups } = generateDataSummary(
      listings,
      selectedCity
    );

    // Build prompt for Hugging Face
    const locationInfo = selectedCity
      ? `តំបន់ដែលបានជ្រើស: ${selectedCity}`
      : userLocation
        ? `ទីតាំងអ្នកប្រើប្រាស់: ${userLocation.lat.toFixed(
          4
        )}, ${userLocation.lng.toFixed(4)}`
        : "";

    const prompt = `You are a helpful assistant for a citizen help coordination platform in Cambodia. 
    Generate a response in Khmer with a warm, calm, and reassuring tone suitable for civilians affected by conflict.
    Briefly describe the types of assistance available in the selected area and the number of resources available.
    If nearby areas offer more or better resources, gently suggest them.
    Always remind readers to call the hotline to confirm availability before visiting.
    Keep the response concise (4-6 sentences) and do not mention zero availability or counts.

Here are examples of good summaries:

Example 1:
Input: Accommodations: 5 open, 2 limited | Fuel Services: 3 open, 1 limited | Transportation: 4 open, 0 limited | Location: Phnom Penh
Output: នៅក្នុងទីក្រុងភ្នំពេញ មានជំនួយជាច្រើនដែលអាចប្រើប្រាស់បាន។ មានកន្លែងស្នាក់នៅ ៧កន្លែង, សេវាសាំង ៤កន្លែង, និងសេវាដឹកជញ្ជូន ៤កន្លែងដែលកំពុងបើកជួយ។ សូមទូរស័ព្ទទៅខ្សែបន្ទាន់ដើម្បីបញ្ជាក់មុនពេលធ្វើដំណើរ។

Example 2:
Input: Accommodations: 2 open, 0 limited | Fuel Services: 1 open, 0 limited | Transportation: 0 open, 0 limited | Location: Siem Reap
Output: នៅក្នុងតំបន់សៀមរាប មានកន្លែងស្នាក់នៅ ២កន្លែង និងសេវាសាំង ១កន្លែងដែលអាចប្រើប្រាស់បាន។ ប្រសិនបើអ្នកត្រូវការជំនួយបន្ថែម សូមពិចារណាទៅកាន់តំបន់ផ្សេងទៀតដូចជា ភ្នំពេញ ឬ បាត់ដំបង។ សូមទូរស័ព្ទទៅខ្សែបន្ទាន់ដើម្បីផ្ទៀងផ្ទាត់ព័ត៌មានថ្មីៗ។

Example 3:
Input: Accommodations: 10 open, 3 limited | Fuel Services: 8 open, 2 limited | Transportation: 6 open, 1 limited | Volunteer Requests: 5 open, 0 limited | Location: Battambang
Output: នៅក្នុងតំបន់បាត់ដំបង មានជំនួយច្រើនប្រភេទដែលអាចប្រើប្រាស់បាន។ មានកន្លែងស្នាក់នៅ ១៣កន្លែង, សេវាសាំង ១០កន្លែង, សេវាដឹកជញ្ជូន ៧កន្លែង, និងមានត្រូវការស្ម័គ្រចិត្ត ៥កន្លែង។ សូមទូរស័ព្ទទៅខ្សែបន្ទាន់ដើម្បីបញ្ជាក់មុនពេលធ្វើដំណើរ។

Now generate a summary for this data:

Available Resources:
- Accommodations: ${counts.accommodation.open} open, ${counts.accommodation.limited
      } limited
- Fuel Services: ${counts.fuel_service.open} open, ${counts.fuel_service.limited
      } limited  
- Transportation: ${counts.car_transportation.open} open, ${counts.car_transportation.limited
      } limited
- Volunteer Requests: ${counts.volunteer_request.open} open, ${counts.volunteer_request.limited
      } limited

${locationInfo}

Resources by Location:
${Object.entries(locationGroups)
        .map(
          ([area, data]) =>
            `${area}: ${data.accommodation} accommodations, ${data.fuel_service} fuel, ${data.car_transportation} transport, ${data.volunteer_request} volunteers needed`
        )
        .join("\n")}

Instructions:
- Follow the format and style of the examples above
- Write in Khmer language using a warm, calm, and reassuring tone
- Clearly mention the types of assistance or resources available in the selected area
- If nearby areas offer more or better resources, gently suggest those alternatives
- Always remind users to call the hotline to confirm current availability
- Keep it gentle and concise (4-6 sentences max)
- Do not mention zero availability or zero counts
- Use natural Khmer language, not literal translations

Generate the summary:`;

    let summary = "";
    let suggestions: string[] = [];

    // Try Hugging Face API if key is available
    if (HUGGINGFACE_API_KEY) {
      try {
        summary = await callHuggingFace(prompt);

        // Extract suggestions (areas with more resources)
        const sortedAreas = Object.entries(locationGroups)
          .filter(([area]) => area !== selectedCity)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 3)
          .map(([area]) => area);

        if (sortedAreas.length > 0) {
          suggestions = sortedAreas;
        }
      } catch (error) {
        console.error("Hugging Face error, using fallback:", error);
        // Fall back to structured summary
        summary = generateFallbackSummary(counts, locationGroups, selectedCity);
        suggestions = Object.entries(locationGroups)
          .filter(
            ([area]) => area !== selectedCity && locationGroups[area].total > 0
          )
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 3)
          .map(([area]) => area);
      }
    } else {
      // Fallback summary without API
      summary = generateFallbackSummary(counts, locationGroups, selectedCity);
      suggestions = Object.entries(locationGroups)
        .filter(
          ([area]) => area !== selectedCity && locationGroups[area].total > 0
        )
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 3)
        .map(([area]) => area);
    }

    return NextResponse.json({
      summary,
      suggestions,
      stats: counts,
      locationStats: locationGroups,
    });
  } catch (error: any) {
    console.error("Summary generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary", message: error.message },
      { status: 500 }
    );
  }
}

// Fallback summary generator
function generateFallbackSummary(
  counts: Record<string, { open: number; limited: number; total: number }>,
  locationGroups: Record<string, any>,
  selectedCity?: string | null
): string {
  const parts: string[] = [];

  if (counts.accommodation.total > 0) {
    parts.push(`${counts.accommodation.total} កន្លែងស្នាក់នៅ`);
  }
  if (counts.fuel_service.total > 0) {
    parts.push(`${counts.fuel_service.total} សេវាសាំង`);
  }
  if (counts.car_transportation.total > 0) {
    parts.push(`${counts.car_transportation.total} សេវាដឹកជញ្ជូន`);
  }
  if (counts.volunteer_request.total > 0) {
    parts.push(`${counts.volunteer_request.total} ត្រូវការស្ម័គ្រចិត្ត`);
  }

  let summary = "";
  if (selectedCity) {
    const cityStats = locationGroups[selectedCity];
    if (cityStats && cityStats.total > 0) {
      summary = `នៅក្នុង${selectedCity} មាន: ${parts.join(", ")}។ `;
    } else {
      summary = `នៅក្នុង${selectedCity} មានធនធានមានកំណត់។ `;
    }
  } else {
    summary = `មានជំនួយដែលអាចប្រើប្រាស់បាន: ${parts.join(", ")}។ `;
  }

  // Add suggestions for other areas
  const otherAreas = Object.entries(locationGroups)
    .filter(([area]) => area !== selectedCity && locationGroups[area].total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 2);

  if (otherAreas.length > 0) {
    summary += `តំបន់ផ្សេងទៀតដែលមានជំនួយ: ${otherAreas
      .map(([area]) => area)
      .join(", ")}។ `;
  }

  summary += "សូមទូរស័ព្ទទៅខ្សែបន្ទាន់ដើម្បីបញ្ជាក់មុនពេលធ្វើដំណើរ។";

  return summary;
}
