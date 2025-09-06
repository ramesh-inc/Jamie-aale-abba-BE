from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from core.models import User, Teacher, Story

@login_required
def teacher_dashboard(request):
    """
    Teacher dashboard view for creating and managing stories.
    Only accessible by teachers.
    """
    # Check if user is a teacher
    if request.user.user_type != 'teacher' or not hasattr(request.user, 'teacher_profile'):
        messages.error(request, 'You do not have permission to access the teacher dashboard.')
        return redirect('core:home')
    
    context = {
        'teacher': request.user.teacher_profile,
        'user': request.user,
    }
    
    return render(request, 'stories/teacher_dashboard.html', context)


def home_view(request):
    """
    Home page view - redirect authenticated users to appropriate dashboard
    """
    if request.user.is_authenticated:
        if request.user.user_type == 'teacher':
            return redirect('core:teacher_dashboard')
        elif request.user.user_type == 'parent':
            return redirect('core:parent_dashboard')
        elif request.user.user_type == 'admin':
            return redirect('core:admin_dashboard')
    
    # For non-authenticated users, show a simple home page
    return render(request, 'core/home.html')


def dashboard_view(request):
    """
    Generic dashboard view that redirects to user-specific dashboard
    """
    if not request.user.is_authenticated:
        return redirect('login')
    
    if request.user.user_type == 'teacher':
        return redirect('core:teacher_dashboard')
    elif request.user.user_type == 'parent':
        return redirect('core:parent_dashboard')  # TODO: Implement parent dashboard
    elif request.user.user_type == 'admin':
        return redirect('core:admin_dashboard')    # TODO: Implement admin dashboard
    
    return redirect('core:home')


@login_required
def parent_dashboard(request):
    """
    Parent dashboard view - placeholder for now
    """
    if request.user.user_type != 'parent':
        messages.error(request, 'You do not have permission to access the parent dashboard.')
        return redirect('core:home')
    
    return render(request, 'core/parent_dashboard.html', {
        'user': request.user,
    })


@login_required  
def admin_dashboard(request):
    """
    Admin dashboard view - placeholder for now
    """
    if request.user.user_type != 'admin':
        messages.error(request, 'You do not have permission to access the admin dashboard.')
        return redirect('core:home')
    
    return render(request, 'core/admin_dashboard.html', {
        'user': request.user,
    })