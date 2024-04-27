// components/Thread.js

import React, { useState, useRef } from 'react';
import Select from 'react-select';
import styles from '../styles/Thread.module.css';

const Thread = ({ onCloseThread, resultPrompt }) => {

  const [reportDetails, setReportDetails] = useState({
    prompt: resultPrompt,
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

  const postToDiscourse = async () => {
    const response = await fetch('http://18.224.86.65:5002/ouroPost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        headers: {
          "Api-Key": "49bd812ab9daebbac85dfadb4c089e0f2f4284816370738d72c9e6e449fa797b",
          // "Api-Key": "faa52080e7da71c54395adbaafa82d33590b26cb3426d0060ea0088ba0f26091",
          "Api-Username": "CMUweaudit-admin",
        },
        params: {
          title: "Report distribution of prompt: " + reportDetails.prompt,
          raw: "Report distribution category: " + reportDetails.visualization.join(', ') + "\n" + 
            "Harm noticed: " + reportDetails.harms.join(', '),
          category: 54, // https://forum.weaudit.org/c/ouroboros-discussion/54
          tags: reportDetails.visualization
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create discourse thread');
    }

    // const responseData = await response.json();
    // window.location.href = responseData.url; // Redirect to the created post
  };

  const [isSubmitted, setIsSubmitted] = useState(false); // track submission

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormFilled) return;

    try {
      await postToDiscourse();
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onCloseThread();
      }, 4500);
    } catch (error) {
      console.error('Error posting to Discourse:', error);
      alert('There was an error posting your thread.');
    }
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
        {/* confirmed message */}
        {isSubmitted && (
          <>
            <div className={styles.overlay} onClick={() => setIsSubmitted(false)} />
            <div className={styles.confirmationContainer}>
              <span className={styles.closeButton} onClick={() => setIsSubmitted(false)}>x</span>
              <h2 className={styles.confirmationTitle}>Posted!</h2>
              <p className={styles.confirmationBody}>Your thread has been posted to the discussion forum.</p>
              <a href="https://forum.weaudit.org/c/stable-diffusion/46" className={styles.goToDiscussionsButton}>Go to discussions</a>
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
                readOnly
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