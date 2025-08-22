"""
Test script to discover Chatterbox TTS supported parameters
"""

try:
    from chatterbox.tts import ChatterboxTTS
    import inspect
    
    # Get the ChatterboxTTS generate method signature
    generate_method = ChatterboxTTS.generate
    signature = inspect.signature(generate_method)
    
    print("Chatterbox TTS generate() method parameters:")
    for param_name, param in signature.parameters.items():
        if param_name != 'self':
            print(f"  - {param_name}: {param.annotation if param.annotation != inspect.Parameter.empty else 'Any'}")
            if param.default != inspect.Parameter.empty:
                print(f"    Default: {param.default}")
    
    # Also check if there's documentation
    if generate_method.__doc__:
        print(f"\nDocumentation:\n{generate_method.__doc__}")
        
except ImportError as e:
    print(f"Chatterbox not installed: {e}")
except Exception as e:
    print(f"Error inspecting Chatterbox: {e}")