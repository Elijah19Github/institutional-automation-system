import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Programmes');

  const categories = ["Under Graduate", "Post Graduate", "Doctoral (PhD)", "Online Degree", "All Programmes"];

  // Data fetching from Backend database
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/courses');
        const data = await res.json();
        setCourses(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch courses from database", err);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter Logic matching Search Engine
  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All Programmes' || course.category === selectedCategory;
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.campus.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="courses-wrapper">
      
      {/* Top Banner */}
      <div className="courses-banner">
        <div className="courses-banner-accent"></div>
        <div className="courses-banner-content">
          <h1 className="courses-banner-title">Course Catalog</h1>
          <p className="courses-banner-desc">Discover the perfect academic pathway. Browse our comprehensive list of programs ranging from undergraduate degrees to advanced doctoral research.</p>
        </div>
      </div>

      <div className="courses-container">
        {/* Top 4 Navigation Cards */}
        <div className="courses-grid">
          {["Under Graduate", "Post Graduate", "Doctoral (PhD)", "Online Degree"].map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedCategory(cat)}
              className={`category-card ${selectedCategory === cat ? 'category-card-active' : 'category-card-inactive'}`}
            >
              <h3 className="category-title">{cat}</h3>
              <p className={`category-link ${selectedCategory === cat ? 'category-link-active' : 'category-link-inactive'}`}>View Programs &rarr;</p>
            </div>
          ))}
        </div>

        {/* Categories Tab & Search Engine */}
        <div className="courses-search-bar">
          
          <div className="courses-filter-tabs">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`filter-btn ${selectedCategory === cat ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Search your course here..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">
              🔍
            </span>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="table-container">
          <div className="table-header">
            <h2 className="table-title">
              <span className="text-3xl">📊</span> {selectedCategory}
            </h2>
          </div>

          <div className="table-scroll">
            <table className="courses-table">
              <thead>
                <tr className="table-head-row">
                  <th className="courses-th">Programme Name</th>
                  <th className="courses-th">Campus</th>
                  <th className="courses-th">Open From</th>
                  <th className="courses-th">Open Until</th>
                  <th className="courses-th">Status</th>
                  <th className="courses-th text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="tr-loading">
                      <div className="spinner-content">
                        <div className="spinner"></div>
                        <span>Loading programmes from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="tr-empty">
                      No programmes found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course.id} className="course-row group">
                      <td className="td-cell">
                        <span className="course-badge">{course.category}</span>
                        <div className="course-name">{course.name}</div>
                      </td>
                      <td className="td-cell td-text">{course.campus}</td>
                      <td className="td-cell td-text-light">{course.open_from}</td>
                      <td className="td-cell td-text-light">{course.open_until}</td>
                      <td className="td-cell">
                        <span className="status-badge">
                          <span className="status-dot"></span>
                          {course.status}
                        </span>
                      </td>
                      <td className="td-cell">
                         {/* Action Buttons mapped to backend PostgreSQL registry */}
                         <div className="actions-wrapper">
                            <Link to="/apply" className="btn-primary">
                              Apply
                            </Link>
                            {course.document_url ? (
                              <a href={`http://localhost:5000${course.document_url}`} className="btn-secondary" target="_blank" rel="noopener noreferrer">
                                Explore
                              </a>
                            ) : (
                              <button className="btn-secondary opacity-50 cursor-not-allowed">
                                Explore
                              </button>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
