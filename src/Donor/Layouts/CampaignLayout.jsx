import React from 'react'
import Navbar from '../components/navbar'
import Campaings from '../Pages/Campaings'
import Footer from '../Pages/footer'

function CampaignLayout() {
  return (
    <div className='font-Outfit'>
      <Navbar/>
      <Campaings/>
      <Footer/>
    </div>
  )
}

export default CampaignLayout
