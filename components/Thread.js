// components/Thread.js

import React, { useState, useRef } from 'react';
import Select from 'react-select';
import styles from '../styles/Thread.module.css';

const Thread = ({ onCloseThread }) => {

  const [reportDetails, setReportDetails] = useState({
    prompt: '',
    visualization: [],
    harms: []
  });

  const visualizationOptions = [
    { value: 'skinTone', label: 'Skin Tone' },
    { value: 'gender', label: 'Gender' },
    { value: 'age', label: 'Age' },
  ];

  const harmsOptions = [
    "Stereotyping",
    "Demeaning social groups",
    "Erasing social groups",
    "Alienating social groups",
    "Cultural harm",
    "Other"
  ];
  
  const descriptions = [
    "Oversimplified and undesirable representations",
    "Differential representation or oppressing social groups",
    "Absence or unequal visibility of social groups",
    "Failure to acknowledge social groups",
    "Predominantly harming a particular culture",
    ""
  ];
  
  const handleInputChange = (event) => {
    const { name, value, type } = event.target;
  
    if (type === 'checkbox') {
      const newHarms = reportDetails.harms.includes(value)
        ? reportDetails.harms.filter((harm) => harm !== value)
        : [...reportDetails.harms, value];
      setReportDetails(prev => ({ ...prev, harms: newHarms }));
    } else {
      setReportDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = selectedOptions => {
    setReportDetails(prev => ({
      ...prev,
      visualization: selectedOptions.map(option => option.value) // Store an array of values
    }));
  };

  const isFormFilled = reportDetails.prompt && reportDetails.visualization.length > 0 && reportDetails.harms.length > 0;
  const [isSubmitted, setIsSubmitted] = useState(false); // track submission

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitted(true); // Set isSubmitted to true when the form is submitted
  
    // Close the thread and hide the confirmation after 4.5 seconds
    setTimeout(() => {
      setIsSubmitted(false); // Hide the confirmation message
      onCloseThread(); // Close the thread
    }, 4500);
  
    // Implement submission logic here (for future use)
    console.log(reportDetails);
  };

  // Function to determine the circle style
  const getCircleStyle = (section) => {
    switch (section) {
      case 'prompt':
        return reportDetails.prompt ? styles.statusCircleActive : styles.statusCircle;
      case 'visualization':
        return reportDetails.visualization.length > 0 ? styles.statusCircleActive : styles.statusCircle;
      case 'harms':
        return reportDetails.harms.length > 0 ? styles.statusCircleActive : styles.statusCircle;
      default:
        return styles.statusCircle;
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onCloseThread} />
      <div className={styles.threadContainer}>

        {isSubmitted && (
          <>
            <div className={styles.overlay} onClick={() => setIsSubmitted(false)} />
            <div className={styles.confirmationContainer}>
              <span className={styles.closeButton} onClick={() => setIsSubmitted(false)}>x</span>
              <h2 className={styles.confirmationTitle}>Posted!</h2>
              <p className={styles.confirmationBody}>Your thread has been posted to the discussion forum.</p>
              <button className={styles.goToDiscussionsButton}>Go to discussions</button>
            </div>
          </>
        )}

        <h2 className={styles.threadTitle}>Create Thread</h2>
        <p className={styles.threadDescription}>
          Threads created are part of WeAudit discussion forum and are used to bring a change in text-to-image algorithms.
        </p>
        
        <div className={styles.formContainer}>
          {/* Status Circles */}
          <div className={styles.statusCircleContainer}>
            <div className={getCircleStyle('prompt')}></div>
            <div className={getCircleStyle('visualization')}></div>
            <div className={getCircleStyle('harms')}></div>
          </div>

          {/* Prompt */}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="prompt">What prompt to report?</label>
              <input
                className={styles.input}
                type="text"
                id="prompt"
                name="prompt"
                value={reportDetails.prompt}
                onChange={handleInputChange}
              />
            </div>

            {/* Visualizatinos */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="visualization">What are you reporting?</label>
              <Select
                name="visualization"
                options={visualizationOptions}
                className={styles.select}
                classNamePrefix="select"
                onChange={handleSelectChange}
                value={visualizationOptions.filter(option => reportDetails.visualization.includes(option.value))}
                isMulti // This enables multiple selections
                closeMenuOnSelect={false} // Keeps the dropdown open after selection
              />
            </div>

            {/* Harm options */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="harms">What harms did you notice?</label>
              {reportDetails.prompt && reportDetails.visualization.length > 0 && (
                harmsOptions.map((harm, index) => (
                  <div key={index} className={styles.checkboxContainer}>
                    <input
                      id={harm}
                      type="checkbox"
                      name="harms"
                      value={harm}
                      checked={reportDetails.harms.includes(harm)}
                      onChange={handleInputChange}
                    />
                    <div className={styles.checkboxTextContainer}>
                      <label htmlFor={harm} className={styles.checkboxLabel}>{harm}</label>
                      <p className={styles.checkboxDescriptionText}>{descriptions[index]}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Submit and cancel buttons */}
            <div className={styles.buttonsContainer}>
              <button className={styles.buttonCancel} onClick={onCloseThread}>Cancel</button>
              <button
                className={`${styles.buttonSubmit} ${isFormFilled ? styles.buttonActive : ''}`}
                type="submit"
                disabled={!isFormFilled} // Optionally disable the button when the form is not fully filled
              >
                Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Thread;