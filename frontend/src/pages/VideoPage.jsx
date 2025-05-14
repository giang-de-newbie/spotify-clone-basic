import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import api from "../services/api"
import "./VideoPage.css"

const VideoPage = () => {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true)
        const [videoRes, relatedRes] = await Promise.all([
          api.getVideo(id),
          api.getVideos()
        ])
        setVideo(videoRes.data)
        // Filter out the current video from related videos
        setRelatedVideos(relatedRes.data.filter(v => v.id !== parseInt(id)))
        console.log("Video data:", videoRes.data)
        console.log("Related videos:", relatedRes.data)
      } catch (error) {
        console.error("Error fetching video data:", error)
      } finally {
        setLoading(false)
      }
    }
  
    fetchVideoData()
  }, [id])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`
    }
    return `${views} views`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return <div className="video-loading"><div className="loading-spinner" /></div>
  }

  if (!video) {
    return (
      <div className="video-error">
        <h2>Video not found</h2>
      </div>
    )
  }

  return (
    <div className="video-page">
      <div className="video-container">
        <div className="video-player">
          <video
            src={video.video_file}
            poster={video.thumbnail}
            controls
            autoPlay={isPlaying}
            className="video-element"
          />
        </div>

        <div className="video-info">
          <h1 className="video-title">{video.title}</h1>
          
          <div className="video-meta">
            <span className="video-views">{formatViews(video.views)}</span>
            <span className="meta-separator">•</span>
            <span className="video-date">{formatDate(video.created_at)}</span>
          </div>

          <div className="video-artist">
            {video.artists.map((artist, index) => (
              <span key={index} className="artist-name">{artist}</span>
            ))}
          </div>

          <div className="video-description">
            <h3>Description</h3>
            <p>{video.description}</p>
          </div>
        </div>
      </div>

      <div className="related-videos">
        <h2 className="related-videos-title">Related Videos</h2>
        <div className="related-videos-list">
          {relatedVideos.map((relatedVideo) => (
            <div key={relatedVideo.id} className="related-video-item">
              <a href={`/video/${relatedVideo.id}`} className="related-video-link">
                <div className="related-video-thumbnail">
                  <img 
                    src={relatedVideo.thumbnail} 
                    alt={relatedVideo.title} 
                    className="thumbnail-image"
                  />
                  <span className="video-duration">{relatedVideo.duration}</span>
                </div>
                <div className="related-video-info">
                  <h3 className="related-video-title">{relatedVideo.title}</h3>
                  <div className="related-video-artist">
                    {relatedVideo.artists.join(", ")}
                  </div>
                  <div className="related-video-meta">
                    <span>{formatViews(relatedVideo.views)}</span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VideoPage