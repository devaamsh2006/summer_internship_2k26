export async function POST(request) {
  try {
    const serviceUrl = process.env.INTERVIEW_SERVICE_URL;
    if (!serviceUrl) {
      return Response.json(
        { error: "INTERVIEW_SERVICE_URL is not configured" },
        { status: 500 }
      );
    }
    const incomingFormData = await request.formData();
    const video = incomingFormData.get("video");

    if (!(video instanceof File)) {
      return Response.json({ error: "Missing video file in FormData field: video" }, { status: 400 });
    }

    const forwardFormData = new FormData();
    forwardFormData.append("video", video, video.name || "interview-video.webm");

    const pythonResponse = await fetch(`${serviceUrl}/analyze-interview`, {
      method: "POST",
      body: forwardFormData,
    });

    const contentType = pythonResponse.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await pythonResponse.json()
      : { error: await pythonResponse.text() };

    return Response.json(payload, { status: pythonResponse.status });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to upload/forward interview video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
