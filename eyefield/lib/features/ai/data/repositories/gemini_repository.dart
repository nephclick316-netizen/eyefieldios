import 'package:google_generative_ai/google_generative_ai.dart';

class GeminiRepository {
  static const String apiKey = "YOUR_GEMINI_API_KEY"; // Should be moved to config

  final GenerativeModel _model = GenerativeModel(
    model: 'gemini-1.5-flash',
    apiKey: apiKey,
  );

  Future<String?> generateResponse(String prompt) async {
    final content = [Content.text(prompt)];
    final response = await _model.generateContent(content);
    return response.text;
  }
}
