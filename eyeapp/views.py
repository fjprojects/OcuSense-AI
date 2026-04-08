from django.shortcuts import render

# Create your views here.

def home(request):

    message = ""

    if request.method == "POST":
        screen_time = request.POST.get("time", "")
        try:
            screen_time_value = int(screen_time)
        except ValueError:
            screen_time_value = None

        if screen_time_value is None:
            message = "Please enter a valid number of minutes."
        elif screen_time_value >= 300:
            message = "⚠️ Warning: More than 5 hours of screen use. Take a long break and rest your eyes."
        elif screen_time_value > 40:
            message = "Your eyes need rest! Follow the 20-20-20 rule."
        else:
            message = "Screen time is safe."

    return render(request, "home.html", {"message": message})