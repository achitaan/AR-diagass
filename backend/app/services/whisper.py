"""
Whisper Speech-to-Text Service

This module provides helper functions for integrating with OpenAI's Whisper API
for speech-to-text conversion in the PainAR healthcare application.
"""

from typing import Optional
import io

from openai import AsyncOpenAI

from app.settings import settings


class WhisperService:
    """
    Service class for handling speech-to-text operations using OpenAI Whisper.
    
    Provides functionality to convert audio files to text transcriptions
    for voice-based interactions in the augmented reality healthcare interface.
    """
    
    def __init__(self) -> None:
        """Initialize the Whisper service with OpenAI client."""
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def transcribe_audio(
        self, 
        audio_data: bytes, 
        filename: str = "audio.wav",
        language: Optional[str] = None
    ) -> str:
        """
        Transcribe audio data to text using Whisper API.
        
        Args:
            audio_data: Raw audio data in bytes
            filename: Name of the audio file (used for format detection)
            language: Optional language code for transcription (e.g., 'en', 'es')
            
        Returns:
            Transcribed text from the audio
            
        Raises:
            RuntimeError: If transcription fails
        """
        try:
            # Create a file-like object from audio bytes
            audio_file = io.BytesIO(audio_data)
            audio_file.name = filename
            
            # Call Whisper API for transcription
            transcript = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="text"
            )
            
            return transcript.strip()
            
        except Exception as e:
            raise RuntimeError(f"Failed to transcribe audio: {str(e)}")
    
    async def translate_audio(
        self, 
        audio_data: bytes, 
        filename: str = "audio.wav"
    ) -> str:
        """
        Translate audio to English text using Whisper API.
        
        Args:
            audio_data: Raw audio data in bytes
            filename: Name of the audio file (used for format detection)
            
        Returns:
            Translated text in English
            
        Raises:
            RuntimeError: If translation fails
        """
        try:
            # Create a file-like object from audio bytes
            audio_file = io.BytesIO(audio_data)
            audio_file.name = filename
            
            # Call Whisper API for translation
            translation = await self.client.audio.translations.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            
            return translation.strip()
            
        except Exception as e:
            raise RuntimeError(f"Failed to translate audio: {str(e)}")


# Global service instance
whisper_service = WhisperService()


async def process_audio_input(
    audio_data: bytes, 
    filename: str = "audio.wav",
    prefer_translation: bool = False,
    language: Optional[str] = None
) -> str:
    """
    Process audio input and return transcribed or translated text.
    
    This helper function provides a simple interface for converting audio
    to text, with options for transcription or translation to English.
    
    Args:
        audio_data: Raw audio data in bytes
        filename: Name of the audio file for format detection
        prefer_translation: If True, translate to English instead of transcribe
        language: Optional language code for transcription
        
    Returns:
        Processed text from the audio input
    """
    if prefer_translation:
        return await whisper_service.translate_audio(audio_data, filename)
    else:
        return await whisper_service.transcribe_audio(
            audio_data, filename, language
        )
