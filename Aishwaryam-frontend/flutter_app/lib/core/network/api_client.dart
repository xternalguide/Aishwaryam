import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // ⚠️ UPDATE THIS to your laptop's current Wi-Fi IP address
  // Run `ipconfig` on Windows and look for "IPv4 Address" under your Wi-Fi adapter
  static const String baseUrl = 'http://192.168.1.35:5044/api';

  // Timeout for all requests (10 seconds)
  static const Duration _timeout = Duration(seconds: 10);

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> get(String endpoint) async {
    final url = '$baseUrl$endpoint';
    print('[API] GET $url');
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: await _getHeaders(),
      ).timeout(_timeout);
      return _processResponse(response, url);
    } on SocketException catch (e) {
      throw Exception('Cannot reach server at $baseUrl. Is the backend running? ($e)');
    } on TimeoutException {
      throw Exception('Request timed out. Is the backend reachable at $baseUrl?');
    } catch (e) {
      throw Exception('Network error on GET $endpoint: $e');
    }
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final url = '$baseUrl$endpoint';
    print('[API] POST $url | body: $body');
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: await _getHeaders(),
        body: jsonEncode(body),
      ).timeout(_timeout);
      return _processResponse(response, url);
    } on SocketException catch (e) {
      throw Exception('Cannot reach server at $baseUrl. Is the backend running? ($e)');
    } on TimeoutException {
      throw Exception('Request timed out. Check that $baseUrl is reachable from this device.');
    } catch (e) {
      throw Exception('Network error on POST $endpoint: $e');
    }
  }

  Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    final url = '$baseUrl$endpoint';
    print('[API] PUT $url | body: $body');
    try {
      final response = await http.put(
        Uri.parse(url),
        headers: await _getHeaders(),
        body: jsonEncode(body),
      ).timeout(_timeout);
      return _processResponse(response, url);
    } on SocketException catch (e) {
      throw Exception('Cannot reach server at $baseUrl. Is the backend running? ($e)');
    } on TimeoutException {
      throw Exception('Request timed out.');
    } catch (e) {
      throw Exception('Network error on PUT $endpoint: $e');
    }
  }

  dynamic _processResponse(http.Response response, String url) {
    print('[API] ${response.statusCode} $url | body: ${response.body.length > 200 ? response.body.substring(0, 200) : response.body}');
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return jsonDecode(response.body);
    } else {
      final errorBody = response.body.isNotEmpty ? jsonDecode(response.body) : {};
      final message = errorBody['message'] ?? errorBody['Message'] ?? 'Error ${response.statusCode}';
      throw Exception(message);
    }
  }
}

// Global instance for simple access
final apiClient = ApiClient();
