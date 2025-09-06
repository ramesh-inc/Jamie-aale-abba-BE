import React, { useState } from 'react';
import { Heart, MessageCircle, Calendar, User, Download, Play, FileText, Image, ChevronDown, ChevronUp, Send, Trash2, MoreVertical } from 'lucide-react';
import { simpleStoryApi } from '../../services/api';
import type { Story, StoryComment } from '../../types/story';

interface StoryCardProps {
  story: Story;
  onUpdate: (updatedStory: Story) => void;
  onDelete: (storyId: number) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onUpdate, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const getStoryTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4 text-amber-600" />;
      case 'video': return <Play className="h-4 w-4 text-red-600" />;
      case 'file': return <FileText className="h-4 w-4 text-green-600" />;
      case 'journal': return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStoryTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-amber-100 text-amber-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'file': return 'bg-green-100 text-green-800';
      case 'journal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await simpleStoryApi.toggleLike(story.id);
      
      // Update the story with new like status
      const updatedStory: Story = {
        ...story,
        user_has_liked: response.liked,
        likes_count: response.likes_count
      };
      
      onUpdate(updatedStory);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const loadComments = async () => {
    if (isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      const response = await simpleStoryApi.getComments(story.id);
      setComments(response);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleShowComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const response = await simpleStoryApi.addComment(story.id, {
        comment_text: newComment.trim()
      });
      
      setComments(prev => [response, ...prev]);
      setNewComment('');
      
      // Update story comment count
      const updatedStory: Story = {
        ...story,
        comments_count: story.comments_count + 1
      };
      onUpdate(updatedStory);
      
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await simpleStoryApi.deleteStory(story.id);
      onDelete(story.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting story:', error);
      // Could add toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (deletingCommentId === commentId) return;
    
    setDeletingCommentId(commentId);
    try {
      await simpleStoryApi.deleteComment(commentId);
      // Remove the comment from the local state
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      // Could add toast notification here
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAttachments = () => {
    if (story.attachments.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        {story.attachments.map((attachment) => {
          console.log('Attachment:', attachment); // Debug log
          return (
            <div key={attachment.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {attachment.file_type === 'image' && (
                <img
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  className="w-full h-auto max-h-96 object-cover"
                  loading="lazy"
                  onError={(e) => console.log('Image load error:', e, 'URL:', attachment.file_url)}
                  onLoad={() => console.log('Image loaded successfully:', attachment.file_url)}
                />
              )}
              {attachment.file_type === 'video' && (
                <video
                  controls
                  className="w-full h-auto max-h-96"
                  preload="metadata"
                >
                  <source src={attachment.file_url} type={attachment.mime_type} />
                  Your browser does not support the video tag.
                </video>
              )}
              {attachment.file_type === 'document' && (
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.file_size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <a
                    href={attachment.file_url}
                    download={attachment.file_name}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Story Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{story.teacher_name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(story.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStoryTypeColor(story.story_type)}`}>
              {getStoryTypeIcon(story.story_type)}
              <span className="ml-1 capitalize">{story.story_type}</span>
            </span>
            {story.can_delete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete story"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Story Content */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{story.title}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{story.content}</p>
        </div>

        {/* Attachments */}
        {renderAttachments()}

        {/* Target Classes */}
        {story.target_classes_names && story.target_classes_names.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Shared with:</span>{' '}
              {story.target_classes_names.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Story Actions */}
      <div className="border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                story.user_has_liked
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
              } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart 
                className={`h-4 w-4 ${story.user_has_liked ? 'fill-current' : ''}`} 
              />
              <span>{story.likes_count}</span>
            </button>
            
            <button
              onClick={handleShowComments}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{story.comments_count}</span>
              {showComments ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Add Comment Form */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <form onSubmit={handleAddComment} className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || isCommenting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Comments List */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {isLoadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {comment.user_name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          {comment.can_delete && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete comment"
                            >
                              {deletingCommentId === comment.id ? (
                                <div className="w-3 h-3 border border-gray-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.comment_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Story</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{story.title}"? This will permanently remove the story and all its attachments.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCard;